## 1. Core ML task restated (GNN-specific)

**Task:**
Learn a function

\[
f_\theta(G, X) \to \hat{Y}
\]

where:

- **Graph \(G = (V, E)\):**
  - \(V\): mesh vertices
  - \(E\): edges from triangle adjacency (two vertices share an edge if they’re connected in the mesh)
- **Node features \(X \in \mathbb{R}^{N \times F}\):**
  - Per-vertex features (geometry, shape, etc.)
- **Labels \(Y \in \{1, \dots, K\}^N\):**
  - Per-vertex region labels from the atlas (K = number of regions)

The model outputs \(\hat{Y}\) (logits per vertex over K classes).

---

## 2. Dataset and file structure (draft spec)

This is the data structure you’d feed into the GNN training pipeline (before Blender ever sees it).

### 2.1 Per-subject files

For each subject `SUBJ_ID`, you have something like:

- **`data/graphs/SUBJ_ID_vertices.npy`**
  - Shape: `(N, 3)` for `(x, y, z)` in a common coordinate frame (or subject frame with known transform).
- **`data/graphs/SUBJ_ID_faces.npy`**
  - Shape: `(F, 3)` integer indices of vertices forming each triangle.
- **`data/graphs/SUBJ_ID_features.npy`**
  - Shape: `(N, F_feat)`
  - Examples:
    - Coordinates (possibly normalized)
    - Surface normals
    - Curvature, sulcal depth, thickness
- **`data/graphs/SUBJ_ID_labels.npy`**
  - Shape: `(N,)` integer labels per vertex, aligned with atlas.

Optional (for determinism and traceability):

- **`data/graphs/SUBJ_ID_meta.json`**
  - Info about transforms, atlas version, pipeline versions.

### 2.2 Global config

- **`config/regions.json`**
  - Maps class indices to region names, colors, etc.
  - Example:
    ```json
    {
      "0": "background",
      "1": "left_amygdala",
      "2": "right_amygdala",
      "...": "..."
    }
    ```

- **`config/train_config.json`**
  - Hyperparameters (learning rate, epochs, GNN depth, hidden size, etc.).
  - Random seeds.
  - Dataset splits.

---

## 3. GNN model design

### 3.1 Graph construction

From `vertices` and `faces`:

- **Nodes:** one per vertex.
- **Edges:** undirected:
  - For every triangle `[i, j, k]`, add edges:
    - \(i \leftrightarrow j\), \(j \leftrightarrow k\), \(k \leftrightarrow i\)
- Optionally, add:
  - **K-nearest neighbor edges** in 3D (if mesh connectivity is sparse or noisy).
  - But keep it deterministic: K fixed, metric clearly defined.

You then store adjacency either as an edge list or sparse matrix, to be built in a deterministic preprocessing step.

### 3.2 Node features

Minimal but sane starting point:

- **Coordinates:** \((x, y, z)\), normalized per subject or globally.
- **Normals:** \((n_x, n_y, n_z)\).
- **Curvature-based features:**
  - Mean curvature.
  - Gaussian curvature.
  - Optional: sulcal depth, cortical thickness (if available).

So feature vector per node might be, for example, \(F = 3 (coords) + 3 (normals) + 2 (curvatures) = 8\) dimensions.

### 3.3 Model architecture

A straightforward GNN for this:

- **Input:**
  - Node features \(X\), adjacency \(A\).
- **Layers:**
  - L stacked graph convolution / message-passing layers (e.g., GCN, GraphSAGE, or GAT).
  - Non-linearities (ReLU/LeakyReLU).
  - Optional batch/graph normalization.
- **Output:**
  - Final layer: linear transform from hidden dim to K classes.
  - Softmax over K classes per node.

So conceptually:

1. \(H^{(0)} = X\)
2. For \(l = 1 \dots L\):
   - \(H^{(l)} = \sigma(\text{GNN\_Layer}(H^{(l-1)}, A))\)
3. \(\hat{Y} = \text{softmax}(H^{(L)} W + b)\)

### 3.4 Loss and training objective

- **Loss:**
  - Per-vertex cross-entropy:
    \[
    \mathcal{L} = \frac{1}{N} \sum_{i=1}^{N} \text{CE}(\hat{y}_i, y_i)
    \]
- **Class imbalance handling:**
  - Class weights inversely proportional to region frequency.
  - Or focal loss if some regions are very small.

---

## 4. Training pipeline (Bash-orchestrated)

Everything here is concept-level; we’re not writing code yet, but clarifying roles.

### 4.1 Preprocessing step

Non-interactive, deterministic scripts that:

1. Load raw surfaces & labels (from your neuroimaging pipeline).
2. Compute:
   - Normals, curvature features.
   - Mesh adjacency.
3. Save:
   - `SUBJ_ID_vertices.npy`
   - `SUBJ_ID_faces.npy`
   - `SUBJ_ID_features.npy`
   - `SUBJ_ID_labels.npy`

This step is itself orchestrated by a Bash script (e.g., `scripts/bash/preprocess_graphs.sh`) that:

- Enumerates subjects.
- Calls Python tools with fixed arguments.
- Fails fast on errors.

### 4.2 Training step

Another Bash script (e.g., `scripts/bash/train_gnn.sh`) would:

- Set deterministic environment:
  - Seeds.
  - Fixed number of threads, if needed.
- Call a training script (Python) with:
  - Path to `config/train_config.json`.
  - Path(s) to dataset directories.
- Log:
  - Config used.
  - Training and validation metrics.
  - Model checkpoint (e.g., `models/gnn_atlas_v1.pth`).

Determinism:

- Fix random seeds (framework, NumPy, Python).
- Avoid nondeterministic GPU ops or log that they exist.
- Keep exact versions of libraries recorded.

### 4.3 Evaluation step

A `scripts/bash/eval_gnn.sh` would:

- Load the trained model.
- Run inference on held-out subjects.
- Compute:
  - Vertex-wise accuracy.
  - Region-wise Dice/IoU.
  - Any additional quality metrics.
- Save results in a deterministic location, e.g.:
  - `results/atlas_gnn_eval.json`

---

## 5. Using the trained GNN to label new meshes

This is where your ML pipeline feeds back into the Blender visualization pipeline.

### 5.1 Inference pipeline

For a new unlabeled brain mesh:

1. **Convert `brain.fbx` to graph input:**
   - Export vertices and faces from `brain.fbx` (once).
   - Compute the same features as in training.
   - Build adjacency.

2. **Run GNN inference:**
   - Load `gnn_atlas_v1.pth`.
   - Generate vertex-wise label predictions \(\hat{Y}\).

3. **Export region masks:**
   - For each region class `k`:
     - Collect all vertex indices with predicted label `k`.
   - Save to file:
     - `output/regions_pred.json`:
       ```json
       {
         "left_amygdala": [12, 43, 44, ...],
         "right_amygdala": [501, 509, ...],
         "...": [...]
       }
       ```

### 5.2 Blender integration

Later, your Bash–Blender pipeline can:

- Load `brain.fbx` and `regions_pred.json` in a Python script.
- Create vertex groups or materials per region.
- Script camera and lighting.
- Render `.mkv` animations at 30 fps, fully headless, via your orchestrating Bash scripts.

---

## 6. Validation against atlas (closing the loop)

Even though the GNN is trained to match the atlas, you still want robust validation:

- **On test subjects with ground-truth atlas labels:**
  - Compare predicted labels vs official atlas labels per vertex.
  - Compute per-region and global metrics.
- **On your canonical `brain.fbx`:**
  - If you can project atlas labels onto it, you can:
    - Quantitatively evaluate vertex-wise predictions.
  - If not, you at least keep consistency checks (e.g., spatial coherence of regions, connectivity).

This ensures the vertex masks you use in Blender are **not arbitrary**, but grounded in atlas-based learning.

---

## 7. Next step in our cycle

We’ve now:

- Chosen **GNN on mesh**.
- Defined:
  - Dataset layout.
  - Node features.
  - Model structure.
  - Training/eval pipeline at a conceptual level.
  - How this connects back to your visualization pipeline.
