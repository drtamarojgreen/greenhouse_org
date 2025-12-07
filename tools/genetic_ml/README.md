# Genetic Machine Learning Tools

This directory contains machine learning pipelines and genetic algorithm simulations demonstrating various theoretical models of growth, resource competition, and geometric constraints.

## Contents

### 1. Two Siblings Stochastic GA (`siblings_ga.py`)
A simulation of two siblings competing for neurotransmitters (growth and energy) in a stochastic environment.
- **Key Concepts**: Monotone contracting genetic rules, shared neurotransmitter pool, constraining cubes, majority growth factor requirement.
- **Goal**: Determine the minimum number of steps and descendants required for the lineages to meet.

### 2. 3D Lattice MCMC Simulation (`lattice_simulation.py`)
A Metropolis-Hastings MCMC simulation on a 3D grid.
- **Features**:
    - Pooled neurotransmitters shared between systems (OPDC and UEOPL).
    - Voronoi-like spatial influence on growth factors.
    - Topology optimization and Prism Cavity constraints.
    - GA parameters modulated by spatial influence.

### 3. Voronoi MCMC GA with Prism Constraint (`mcmc_voronoi_ga_prism.py`)
An advanced MCMC/Monte-Carlo simulation coupling a pooled-neurotransmitter model with a genetic algorithm on a 2D Voronoi tessellation.
- **Features**:
    - Organisms placed on Voronoi cells.
    - Topology-informed crossover/mutation.
    - Prism-cavity constraints separating OPDC and UEOPL regions.
    - **No External Geometry Libs**: Uses custom NumPy implementations for polygon clipping and geometric calculations.

## Theoretical Framework

### Two Siblings Stochastic Game

**Problem Statement**: In a stochastic game, two siblings (L and R) vie from a pool of neurotransmitters. They have dimension $n$ (half-edge). On each turn, they rest or reproduce. Reproduction spawns a child of half size ($n/2$) at a distance proportional to utilized growth factor $g$.

**Notation**:
*   **Siblings**: $L$ (left, $x=0$) and $R$ (right, $x=2n$). Half-edge $n$.
*   **Constraining Cube**: Ancestor $i$ has cube $[c_i - r_i, c_i + r_i]$. Descendants cannot reside in ancestor cubes.
*   **Movement**: Spending $g$ growth moves child $d = \alpha \cdot g$.
*   **Size Rule**: Generation $k$ has half-edge $r_k = n / 2^k$.
*   **Meeting Criterion**: Descendants from L and R overlap.

**Lemma 1 (Overlap Inequality)**:
For descendants $L2$ and $R2$ (grandchildren) to overlap on Turn 2, their separation distance $\Delta x$ must be less than the sum of their half-edges ($2 r_2 = n/2$). This implies:
$$
\alpha(g2_L + g2_R) > \frac{n}{2} + d1_L + d1_R
$$
where $g2$ are growth allocations on turn 2 and $d1$ are outward distances moved on turn 1.

**Minimal Requirements**:
*   **Descendants**: Minimum 2 total (one from each lineage).
*   **Turns**: Minimum 2 turns (parents reproduce outward, children reproduce inward).

**Condition for 2-Turn Meeting**:
Using Lemma 1, for a meeting to occur in 2 turns, the shared growth pool $G$ must satisfy:
$$
G > 2(g1_L + g1_R) + \frac{n}{2\alpha}
$$
Under minimal outward placement (siblings move just enough to clear parent cubes), the minimal pool is:
$$
G_{\min}^{(2)} = \frac{13n}{2\alpha}
$$

## Pipeline Proofs: Efficiency and Complexity

### 1. Convergence of Neurotransmitter Dynamics

**Lemma 2 (Contraction Condition)**:
Let $F(G)$ be the update map for the neurotransmitter pool. $F$ is a contraction mapping if the total sensitivity of consumption to pool changes is strictly bounded below 1. Formally:
$$
||C+E|| \cdot L_f < 1
$$
where $||C+E||$ is the operator norm of the consumption matrices and $L_f$ is the Lipschitz constant of the reproduction response $f(G)$.

**Theorem**: Under bounded influence assumptions (Lemma 2), the neurotransmitter pool dynamics converge to a unique fixed point, even as the number of neurotransmitters $m$ increases.

**Proof**:
The dynamics are modeled by the mapping $F(G) = G - (C+E)f(G) + b$.
1.  **Contraction**: By Lemma 2, $F$ is a contraction mapping on the bounded domain $S$.
2.  **Banach Fixed-Point Theorem**: A contraction on a complete metric space has a unique fixed point $G^*$ and iterates converge exponentially.
3.  **Scaling $m$**: Increasing the number of neurotransmitters $m$ adds dimensions. Convergence is preserved if the aggregate feedback gain (operator norm of the extended $C+E$) remains $< 1$.

### 2. Matrix Formulation & Reliance

**Reliance Vector**: The sensitivity of long-run reproduction $R$ to sustained changes in neurotransmitter $i$.
$$
r^{(long)} = w^\top J_f (I - A)^{-1}
$$
Where:
*   $J_f$: Jacobian of reproduction w.r.t. pool.
*   $A = I - C J_f$: Linearized propagation matrix.
*   $(I-A)^{-1}$: Resolvent capturing infinite feedback loops.

**Algorithm**:
1.  Find fixed point $G^*$.
2.  Compute Jacobian $J_f$ at $G^*$.
3.  Compute $r^{(long)}$ via linear solve (avoiding explicit inversion for stability).

### 3. PLS Surrogate & Allocation Bounds

**Lemma 3 (Fractional Knapsack Optimality)**:
For a linear objective $b^\top x$ subject to a linear budget constraint $a^\top x \le B_{tot}$ and $x \ge 0$, the optimal solution is given by the greedy strategy: allocate budget to variables in descending order of the ratio $b_i/a_i$.

**Proposition**: For a Partial Least Squares (PLS) surrogate model with $K$ components, the optimal resource allocation is solvable via a **Fractional Knapsack** approach.

**Proof**:
1.  **Predictor**: The PLS predictor is linear: $\hat{y} = x^\top B_{PLS}$.
2.  **Optimization**: Maximizing $\hat{y}$ subject to budget $a^\top x \le B_{tot}$ is a linear program (LP).
3.  **Solution**: By **Lemma 3**, the optimal solution to this continuous optimization problem is the greedy allocation.
4.  **Bound**: The closed-form upper bound for unit costs is $B_{tot} \cdot \max_i \{ b_j(i), 0 \}$.

## Requirements

Install dependencies:

```bash
pip install -r requirements.txt
```

Dependencies: `numpy`, `scipy`, `networkx`, `tqdm`, `scikit-learn`.
