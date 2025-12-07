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
    - Visualizations of the Voronoi tessellation and influence maps.

## Requirements

Install the necessary dependencies using pip:

```bash
pip install -r requirements.txt
```

Dependencies include: `numpy`, `scipy`, `matplotlib`, `shapely`, `networkx`, `tqdm`, `scikit-learn`.
