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

**Lemma 2 (Minimal Pool Size)**:
Assuming minimal outward placement ($d1 \approx 1.5n$), the minimum shared growth pool $G$ required for a meeting in 2 turns is derived from Lemma 1:
$$
G_{\min}^{(2)} = \frac{13n}{2\alpha}
$$
If $G < G_{\min}^{(2)}$, a 2-turn meeting is geometrically impossible under the constraint that descendants cannot reside in ancestor cubes.

### Pipeline Proofs: Efficiency and Complexity

#### 1. Convergence of Neurotransmitter Dynamics

**Lemma 3 (Linearized Propagation)**:
The dynamics of the neurotransmitter pool $G_t$ can be linearized around a fixed point $G^*$ as:
$$
\Delta G_{t+1} = A \Delta G_t
$$
where $A = I - C J_f$, $C$ is the consumption matrix, and $J_f$ is the Jacobian of the reproduction map.

**Lemma 4 (Contraction Condition)**:
Let $F(G)$ be the update map for the neurotransmitter pool. $F$ is a contraction mapping if the total sensitivity of consumption to pool changes is strictly bounded below 1. Formally:
$$
||C+E|| \cdot L_f < 1
$$
where $||C+E||$ is the operator norm of the consumption matrices and $L_f$ is the Lipschitz constant of the reproduction response $f(G)$.

**Theorem (Convergence)**:
Under bounded influence assumptions (Lemma 4), the neurotransmitter pool dynamics converge to a unique fixed point, even as the number of neurotransmitters $m$ increases.
*Proof*: By Lemma 4, $F$ is a contraction on a complete metric space. By the Banach Fixed-Point Theorem, a unique fixed point exists and iterates converge exponentially. Adding dimensions ($m \to m+1$) preserves convergence if the aggregate feedback gain remains $< 1$.

#### 2. Matrix Formulation & Reliance

**Lemma 5 (Long-Run Reliance)**:
The sensitivity of long-run reproduction $R$ to sustained changes in neurotransmitter $i$ (the reliance vector) is given by the resolvent of the linearized system:
$$
r^{(long)} = w^\top J_f (I - A)^{-1}
$$
This accounts for infinite feedback loops in the network.

**Algorithm**:
1.  Find fixed point $G^*$.
2.  Compute Jacobian $J_f$ at $G^*$.
3.  Compute $r^{(long)}$ via linear solve (avoiding explicit inversion for stability).

#### 3. PLS Surrogate & Allocation Bounds

**Lemma 6 (PLS Regression Coefficients)**:
For a Partial Least Squares (PLS) regression with $K$ components, the regression coefficient matrix $B_{PLS}$ mapping centered predictors $X$ to response $Y$ has the closed form:
$$
B_{PLS} = W (P^\top W)^{-1} Q^\top
$$
where $W$ are weights, $P$ are loadings, and $Q$ are Y-loadings.

**Lemma 7 (Fractional Knapsack Optimality)**:
For a linear objective $b^\top x$ subject to a linear budget constraint $a^\top x \le B_{tot}$ and $x \ge 0$, the optimal solution is given by the greedy strategy: allocate budget to variables in descending order of the ratio $b_i/a_i$.

**Proposition (Multi-Component PLS Bound)**:
For a PLS surrogate model with $K$ components, the optimal resource allocation is solvable via a **Fractional Knapsack** approach.
*Proof*:
1.  The PLS predictor is linear: $\hat{y} = x^\top B_{PLS}$ (Lemma 6).
2.  Maximizing $\hat{y}$ subject to budget is a linear program.
3.  By Lemma 7, the solution is the greedy allocation.
4.  The closed-form upper bound for unit costs is $B_{tot} \cdot \max_i \{ b_j(i), 0 \}$.

## Requirements

Install dependencies:

```bash
pip install -r requirements.txt
```

Dependencies: `numpy`, `scipy`, `networkx`, `tqdm`, `scikit-learn`.
