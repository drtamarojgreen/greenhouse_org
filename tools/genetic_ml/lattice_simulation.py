"""
MCMC simulation exploring:
- Pooled neurotransmitters shared between two systems: OPDC and UEOPL
- Voronoi-like spatial influence on neurotransmitter growth factors (no external libs)
- GA parameters (crossover, mutation) modulated by spatial influence and pooled levels
- Topology optimization proxy: fitness combines coverage, cavity compliance, and stability
- Prism cavity constraint: forbidden volume between OPDC and UEOPL must remain empty
- Metropolis-Hastings MCMC sampling over configurations

This is a pedagogical model, not a domain-accurate OPDC/UEOPL solver.
"""

import numpy as np
import math
import random
from collections import defaultdict, Counter

np.random.seed(123)
random.seed(123)

# -----------------------------
# Configuration
# -----------------------------
GRID_SIZE = (60, 30, 20)  # 3D lattice (X, Y, Z)
NUM_SEEDS = 12            # Voronoi seeds
NEURO_TYPES = ["E", "I", "M1", "M2"]  # excitatory, inhibitory, modulatory1, modulatory2
POOL_INIT = {"E": 1.0, "I": 1.0, "M1": 1.0, "M2": 1.0}  # pooled neurotransmitters (normalized units)
STEPS = 3000
BURN_IN = 500
SAMPLE_INTERVAL = 20

# Prism cavity region (forbidden space) as axis-aligned box
# Define two systems regions: OPDC on left, UEOPL on right
OPDC_BOX = {"xmin": 0, "xmax": 24, "ymin": 5, "ymax": 25, "zmin": 4, "zmax": 16}
UEOPL_BOX = {"xmin": 36, "xmax": 59, "ymin": 5, "ymax": 25, "zmin": 4, "zmax": 16}
CAVITY_BOX = {"xmin": 26, "xmax": 34, "ymin": 6, "ymax": 24, "zmin": 6, "zmax": 14}  # no occupancy allowed

# GA parameter bounds
CROSSOVER_RANGE = (0.3, 0.9)
MUTATION_RANGE = (0.001, 0.1)

# -----------------------------
# Geometry helpers
# -----------------------------
def in_box(x, y, z, box):
    return (box["xmin"] <= x <= box["xmax"] and
            box["ymin"] <= y <= box["ymax"] and
            box["zmin"] <= z <= box["zmax"])

def random_point_in_box(box):
    x = random.randint(box["xmin"], box["xmax"])
    y = random.randint(box["ymin"], box["ymax"])
    z = random.randint(box["zmin"], box["zmax"])
    return (x, y, z)

def seed_points(num, grid):
    # Seed half in OPDC, half in UEOPL
    pts = []
    half = num // 2
    for _ in range(half):
        pts.append(random_point_in_box(OPDC_BOX))
    for _ in range(num - half):
        pts.append(random_point_in_box(UEOPL_BOX))
    return np.array(pts, dtype=float)  # shape (num, 3)

def influence_matrix(seeds, grid):
    """
    Voronoi-like soft assignment: weights decay with squared distance to seeds.
    Returns a dict {(x,y,z): weights over seeds}.
    """
    sx = seeds.shape[0]
    weights = {}
    # Gaussian-like decay
    sigma2 = 100.0
    X, Y, Z = grid
    for x in range(X):
        for y in range(Y):
            for z in range(Z):
                # Skip cavity region entirely
                if in_box(x, y, z, CAVITY_BOX):
                    continue
                d2 = np.sum((seeds - np.array([x, y, z]))**2, axis=1)  # (sx,)
                w = np.exp(-d2 / sigma2)
                w_sum = np.sum(w)
                if w_sum <= 0:
                    continue
                weights[(x, y, z)] = w / w_sum
    return weights  # mapping voxel -> seed-weight vector

# -----------------------------
# System state
# -----------------------------
class SystemState:
    def __init__(self, grid_size):
        self.grid_size = grid_size
        self.seeds = seed_points(NUM_SEEDS, grid_size)
        self.pool = dict(POOL_INIT)
        # GA parameters per system (OPDC, UEOPL)
        self.ga = {
            "OPDC": {"crossover": random.uniform(*CROSSOVER_RANGE),
                     "mutation": random.uniform(*MUTATION_RANGE)},
            "UEOPL": {"crossover": random.uniform(*CROSSOVER_RANGE),
                      "mutation": random.uniform(*MUTATION_RANGE)},
        }
        # Occupancy map: voxel -> neuron type or None
        self.occ = {}
        # Influence matrix cached
        self.infl = influence_matrix(self.seeds, grid_size)
        # Initialize random occupancy respecting cavity constraint
        self.random_fill_initial()

    def random_fill_initial(self):
        X, Y, Z = self.grid_size
        for (x, y, z), w in self.infl.items():
            # Assign OPDC side or UEOPL side occupancy likelihood
            side = "OPDC" if x <= OPDC_BOX["xmax"] else ("UEOPL" if x >= UEOPL_BOX["xmin"] else "MID")
            if side == "MID":
                # Allow sparse occupancy in the mid corridor but not inside cavity
                p_occ = 0.02
            else:
                p_occ = 0.15
            if random.random() < p_occ:
                # Draw neuron type from pooled levels modulated by local weights
                # Pool vector order [E, I, M1, M2]
                pool_vec = np.array([self.pool["E"], self.pool["I"], self.pool["M1"], self.pool["M2"]], dtype=float)
                # Use local seed mixture to modulate excit/inhib balance
                # Define seed tag by side: left seeds bias I, right seeds bias E (toy model)
                left_bias = np.mean(w[:NUM_SEEDS//2]) if len(w) >= NUM_SEEDS//2 else 0.5
                right_bias = 1.0 - left_bias
                # Modulators improve stability: prefer M1/M2 when variance high
                pool_vec_mod = pool_vec.copy()
                pool_vec_mod[0] *= (0.6 + 0.8 * right_bias)   # E
                pool_vec_mod[1] *= (0.6 + 0.8 * left_bias)    # I
                pool_vec_mod[2] *= 0.8                        # M1
                pool_vec_mod[3] *= 0.8                        # M2
                probs = pool_vec_mod / (np.sum(pool_vec_mod) + 1e-9)
                choice = np.random.choice(NEURO_TYPES, p=probs)
                self.occ[(x, y, z)] = choice

    def copy(self):
        c = SystemState(self.grid_size)
        c.seeds = np.array(self.seeds, dtype=float)
        c.pool = dict(self.pool)
        c.ga = {"OPDC": dict(self.ga["OPDC"]), "UEOPL": dict(self.ga["UEOPL"])}
        c.occ = dict(self.occ)
        c.infl = dict(self.infl)
        return c

# -----------------------------
# Constraints and fitness
# -----------------------------
def cavity_violation(state):
    # Any occupancy in CAVITY_BOX is a hard violation
    for (x, y, z) in state.occ.keys():
        if in_box(x, y, z, CAVITY_BOX):
            return True
    return False

def coverage_metric(state):
    # Fraction of non-empty voxels in OPDC and UEOPL
    opdc_count = 0
    ueopl_count = 0
    for (x, y, z), typ in state.occ.items():
        if in_box(x, y, z, OPDC_BOX):
            opdc_count += 1
        elif in_box(x, y, z, UEOPL_BOX):
            ueopl_count += 1
    # Normalize by box volumes
    opdc_vol = (OPDC_BOX["xmax"] - OPDC_BOX["xmin"] + 1) * (OPDC_BOX["ymax"] - OPDC_BOX["ymin"] + 1) * (OPDC_BOX["zmax"] - OPDC_BOX["zmin"] + 1)
    ueopl_vol = (UEOPL_BOX["xmax"] - UEOPL_BOX["xmin"] + 1) * (UEOPL_BOX["ymax"] - UEOPL_BOX["ymin"] + 1) * (UEOPL_BOX["zmax"] - UEOPL_BOX["zmin"] + 1)
    return (opdc_count / opdc_vol, ueopl_count / ueopl_vol)

def stability_metric(state):
    # Penalize extremes in pooled neurotransmitters; reward balance
    v = np.array([state.pool[t] for t in NEURO_TYPES])
    v = v / (np.sum(v) + 1e-9)
    entropy = -np.sum(v * np.log(v + 1e-9))
    return entropy  # higher entropy => more balanced

def ga_cost(state):
    # Penalize high mutation when cavity corridor is tight; reward crossover balance
    cross = (state.ga["OPDC"]["crossover"] + state.ga["UEOPL"]["crossover"]) / 2
    mut = (state.ga["OPDC"]["mutation"] + state.ga["UEOPL"]["mutation"]) / 2
    # corridor occupancy near cavity borders
    corridor_pressure = 0.0
    for (x, y, z), typ in state.occ.items():
        if CAVITY_BOX["xmin"] - 1 <= x <= CAVITY_BOX["xmax"] + 1 and \
           CAVITY_BOX["ymin"] - 1 <= y <= CAVITY_BOX["ymax"] + 1 and \
           CAVITY_BOX["zmin"] - 1 <= z <= CAVITY_BOX["zmax"] + 1:
            corridor_pressure += 1.0
    corridor_pressure = corridor_pressure / 1000.0
    cost = 0.5 * mut + 0.2 * abs(cross - 0.6) + 0.3 * corridor_pressure
    return cost

def fitness(state):
    if cavity_violation(state):
        return -1e6  # hard rejection
    opdc_cov, ueopl_cov = coverage_metric(state)
    stability = stability_metric(state)
    cost = ga_cost(state)
    # Topology optimization proxy: maximize coverage balance and stability, minimize GA cost
    balance = 1.0 - abs(opdc_cov - ueopl_cov)
    return 2.0 * balance + 1.5 * stability - 1.0 * cost

# -----------------------------
# Proposals (MCMC moves)
# -----------------------------
def propose_seed_jitter(state):
    c = state.copy()
    idx = random.randrange(NUM_SEEDS)
    jitter = np.random.normal(0, 1.5, size=3)
    c.seeds[idx] = np.clip(c.seeds[idx] + jitter, [0,0,0], np.array(state.grid_size) - 1)
    # Recompute influence locally (for simplicity recompute all)
    c.infl = influence_matrix(c.seeds, c.grid_size)
    # Clear occupancy in cavity if any accidental assignment creeps in (defensive)
    c.occ = {k: v for k, v in c.occ.items() if not in_box(*k, CAVITY_BOX)}
    return c

def propose_pool_shift(state):
    c = state.copy()
    # Transfer small mass between neurotransmitters (pooling)
    i, j = random.sample(range(len(NEURO_TYPES)), 2)
    keys = NEURO_TYPES
    delta = np.random.uniform(-0.05, 0.05)
    c.pool[keys[i]] = max(0.01, c.pool[keys[i]] + delta)
    c.pool[keys[j]] = max(0.01, c.pool[keys[j]] - delta)
    # Normalize total
    tot = sum(c.pool.values())
    for k in keys:
        c.pool[k] /= tot
    return c

def propose_ga_tune(state):
    c = state.copy()
    sys = random.choice(["OPDC", "UEOPL"])
    c.ga[sys]["crossover"] = np.clip(
        c.ga[sys]["crossover"] + np.random.normal(0, 0.05),
        CROSSOVER_RANGE[0], CROSSOVER_RANGE[1]
    )
    c.ga[sys]["mutation"] = np.clip(
        c.ga[sys]["mutation"] + np.random.normal(0, 0.005),
        MUTATION_RANGE[0], MUTATION_RANGE[1]
    )
    return c

def propose_occupancy_flip(state):
    c = state.copy()
    # Select a voxel near OPDC or UEOPL, avoid cavity
    if len(c.infl) == 0:
        return c
    v = random.choice(list(c.infl.keys()))
    # Flip occupancy: toggle or change type
    if v in c.occ:
        # change type
        current = c.occ[v]
        choices = [t for t in NEURO_TYPES if t != current]
        c.occ[v] = random.choice(choices)
    else:
        # add occupancy with type drawn from pool
        probs = np.array([c.pool["E"], c.pool["I"], c.pool["M1"], c.pool["M2"]], dtype=float)
        probs = probs / (probs.sum() + 1e-9)
        c.occ[v] = np.random.choice(NEURO_TYPES, p=probs)
    return c

PROPOSALS = [propose_seed_jitter, propose_pool_shift, propose_ga_tune, propose_occupancy_flip]

# -----------------------------
# Metropolis-Hastings MCMC
# -----------------------------
def run_mcmc(steps=STEPS, burn_in=BURN_IN, sample_interval=SAMPLE_INTERVAL):
    state = SystemState(GRID_SIZE)
    f_cur = fitness(state)
    samples = []
    stats = {"energy": [], "pool": [], "ga": []}

    for t in range(steps):
        prop_fn = random.choice(PROPOSALS)
        cand = prop_fn(state)
        f_prop = fitness(cand)

        # MH accept/reject (maximize fitness -> energy = -fitness)
        dE = -(f_prop) - (-(f_cur))  # = f_cur - f_prop
        accept_p = min(1.0, math.exp(-dE))
        if random.random() < accept_p:
            state = cand
            f_cur = f_prop

        # Tracking
        if t >= burn_in and (t - burn_in) % sample_interval == 0:
            samples.append(state.copy())
            stats["energy"].append(-f_cur)
            stats["pool"].append([state.pool[k] for k in NEURO_TYPES])
            stats["ga"].append([state.ga["OPDC"]["crossover"], state.ga["OPDC"]["mutation"],
                                state.ga["UEOPL"]["crossover"], state.ga["UEOPL"]["mutation"]])

    return samples, stats

# -----------------------------
# Aggregation and reporting
# -----------------------------
def summarize(samples, stats):
    pool_arr = np.array(stats["pool"])
    ga_arr = np.array(stats["ga"])
    energy_arr = np.array(stats["energy"])

    pool_mean = pool_arr.mean(axis=0) if len(pool_arr) else np.zeros(len(NEURO_TYPES))
    pool_std = pool_arr.std(axis=0) if len(pool_arr) else np.zeros(len(NEURO_TYPES))

    ga_mean = ga_arr.mean(axis=0) if len(ga_arr) else np.zeros(4)
    ga_std = ga_arr.std(axis=0) if len(ga_arr) else np.zeros(4)

    # Occupancy composition across samples
    comp_counts = Counter()
    total_vox = 0
    for s in samples:
        comp_counts.update(s.occ.values())
        total_vox += len(s.occ)
    comp_freq = {k: (v / max(1, total_vox)) for k, v in comp_counts.items()}

    # Cavity compliance rate
    cavity_ok = sum(1 for s in samples if not cavity_violation(s))
    cavity_rate = cavity_ok / max(1, len(samples))

    return {
        "pool_mean": dict(zip(NEURO_TYPES, pool_mean)),
        "pool_std": dict(zip(NEURO_TYPES, pool_std)),
        "ga_mean": {
            "OPDC": {"crossover": ga_mean[0], "mutation": ga_mean[1]},
            "UEOPL": {"crossover": ga_mean[2], "mutation": ga_mean[3]},
        },
        "ga_std": {
            "OPDC": {"crossover": ga_std[0], "mutation": ga_std[1]},
            "UEOPL": {"crossover": ga_std[2], "mutation": ga_std[3]},
        },
        "energy_mean": float(energy_arr.mean()) if len(energy_arr) else None,
        "energy_std": float(energy_arr.std()) if len(energy_arr) else None,
        "occupancy_freq": comp_freq,
        "cavity_compliance": cavity_rate,
    }

def print_summary(summary):
    print("=== MCMC Summary ===")
    print("Average pooled neurotransmitters (mean ± std):")
    for k in NEURO_TYPES:
        m = summary["pool_mean"][k]
        s = summary["pool_std"][k]
        print(f"  {k}: {m:.3f} ± {s:.3f}")
    print("GA parameters (mean ± std):")
    print(f"  OPDC crossover: {summary['ga_mean']['OPDC']['crossover']:.3f} ± {summary['ga_std']['OPDC']['crossover']:.3f}")
    print(f"  OPDC mutation:  {summary['ga_mean']['OPDC']['mutation']:.4f} ± {summary['ga_std']['OPDC']['mutation']:.4f}")
    print(f"  UEOPL crossover:{summary['ga_mean']['UEOPL']['crossover']:.3f} ± {summary['ga_std']['UEOPL']['crossover']:.3f}")
    print(f"  UEOPL mutation: {summary['ga_mean']['UEOPL']['mutation']:.4f} ± {summary['ga_std']['UEOPL']['mutation']:.4f}")
    print(f"Energy: mean={summary['energy_mean']}, std={summary['energy_std']}")
    print("Occupancy frequency across samples:")
    for k, v in summary["occupancy_freq"].items():
        print(f"  {k}: {v:.3f}")
    print(f"Cavity compliance rate: {summary['cavity_compliance']:.3f}")
    print("====================")

# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":
    samples, stats = run_mcmc()
    summary = summarize(samples, stats)
    print_summary(summary)
