# mcmc_voronoi_ga_prism.py
# Monte Carlo / MCMC coupling: pooled neurotransmitters + GA on Voronoi topology + prism constraint
# Adapted to run without matplotlib or shapely dependencies.

import numpy as np
from scipy.spatial import Voronoi
import networkx as nx
from tqdm import trange
import random
import math

# -------------------------
# PARAMETERS (tune these)
# -------------------------
L = 10.0                     # half-width of square domain [-L,L]^2
N_sites = 60                 # number of Voronoi seeds / initial organisms
m = 4                        # number of neurotransmitters (growth, energy, comm, exo)
np.random.seed(1234)
random.seed(1234)

# neurotransmitter names
nt_names = ['growth', 'energy', 'communication', 'exo'][:m]

# total pool initial amounts (global)
pool_init = np.array([20.0, 15.0, 10.0, 8.0])[:m]

# GA parameters
n_generations = 12
pop_per_site = 1             # 1 organism per site initially
mutation_rate = 0.15
crossover_rate = 0.6
comm_cost_per_attempt = 0.1  # comm units required to broadcast attempt

# Prism cavity (forbidden rectangle) in 2D (x_min, x_max, y_min, y_max)
prism_rect = [-1.0, 1.0, -L, L]  # narrow vertical prism in the center

# MCMC parameters
n_mcmc = 200                 # number of MCMC samples
proposal_scale = 0.05        # std dev for Gaussian random walk on parameters
seed_sim_per_mcmc = 3        # run this many GA trials per proposed setting and average
beta_OPDC = 1.0              # weight in likelihood for OPDC objective
UEOPL_hard_limit = 30.0      # e.g., max total growth withdrawal per turn allowed

# -------------------------
# Geometric Utility Functions (Replacements for Shapely)
# -------------------------

def polygon_area(vertices):
    """Compute area of a polygon using the Shoelace formula."""
    if len(vertices) < 3:
        return 0.0
    x = vertices[:, 0]
    y = vertices[:, 1]
    return 0.5 * np.abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))

def polygon_perimeter(vertices):
    """Compute perimeter of a polygon."""
    if len(vertices) < 2:
        return 0.0
    perimeter = 0.0
    for i in range(len(vertices)):
        p1 = vertices[i]
        p2 = vertices[(i + 1) % len(vertices)]
        perimeter += np.linalg.norm(p1 - p2)
    return perimeter

def clip_line_segment(p1, p2, bbox):
    """
    Cohen-Sutherland like clipping or simple line-box intersection
    is not enough for polygons. We need Sutherland-Hodgman.
    This function is not used directly, see clip_polygon_to_box.
    """
    pass

def clip_polygon_to_box(subject_polygon, bbox):
    """
    Clip a polygon to a bounding box [xmin, ymin, xmax, ymax]
    using Sutherland-Hodgman algorithm.
    subject_polygon: list or array of [x, y] vertices
    """
    if len(subject_polygon) == 0:
        return np.array([])

    xmin, ymin, xmax, ymax = bbox

    def inside(p, edge):
        if edge == 'left':   return p[0] >= xmin
        if edge == 'right':  return p[0] <= xmax
        if edge == 'bottom': return p[1] >= ymin
        if edge == 'top':    return p[1] <= ymax

    def compute_intersection(p1, p2, edge):
        # Line p1-p2 intersection with edge line
        x1, y1 = p1
        x2, y2 = p2

        if edge == 'left':
            x = xmin
            y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1 + 1e-9)
        elif edge == 'right':
            x = xmax
            y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1 + 1e-9)
        elif edge == 'bottom':
            y = ymin
            x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1 + 1e-9)
        elif edge == 'top':
            y = ymax
            x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1 + 1e-9)
        return np.array([x, y])

    output_list = subject_polygon

    for edge in ['left', 'right', 'bottom', 'top']:
        input_list = output_list
        output_list = []
        if len(input_list) == 0:
            break

        S = input_list[-1]
        for E in input_list:
            if inside(E, edge):
                if not inside(S, edge):
                    output_list.append(compute_intersection(S, E, edge))
                output_list.append(E)
            elif inside(S, edge):
                output_list.append(compute_intersection(S, E, edge))
            S = E

    return np.array(output_list)

# -------------------------
# Voronoi Helpers
# -------------------------

def sample_voronoi_points(n, L):
    pts = np.random.uniform(-L, L, size=(n,2))
    return pts

def build_voronoi_regions_clipped(pts, L):
    """
    Compute Voronoi and clip regions to box [-L, -L, L, L].
    """
    # To ensure Voronoi cells cover the area properly near edges,
    # we can mirror points or use a large bounding box.
    # Scipy Voronoi handles the diagram, we just need to reconstruct regions.
    # The 'regions' attribute contains indices of vertices.
    # -1 indicates a vertex at infinity.

    # Strategy: Add dummy points far away to bound the diagram or
    # handle infinite regions by intersecting with box.
    # Simpler: Mirror points around the box to ensure all internal cells are finite.

    # Creating a mirrored set of points for robust Voronoi generation
    # (9 copies of the points shifted)
    points_all = []
    shifts = [
        (0,0), (2*L,0), (-2*L,0), (0,2*L), (0,-2*L),
        (2*L, 2*L), (2*L, -2*L), (-2*L, 2*L), (-2*L, -2*L)
    ]

    for dx, dy in shifts:
        points_all.append(pts + np.array([dx, dy]))

    points_all = np.vstack(points_all)

    vor = Voronoi(points_all)

    # We only care about the regions corresponding to the original points (first N)
    regions_clipped = []
    bbox = [-L, -L, L, L]

    for i in range(len(pts)):
        region_idx = vor.point_region[i] # Index of region for point i
        region_vert_indices = vor.regions[region_idx]

        if -1 in region_vert_indices or len(region_vert_indices) == 0:
            # Should not happen with mirrored points, but safety check
            regions_clipped.append(np.array([]))
            continue

        vertices = vor.vertices[region_vert_indices]
        clipped = clip_polygon_to_box(vertices, bbox)
        regions_clipped.append(clipped)

    return vor, regions_clipped

def compute_site_features(regions):
    n = len(regions)
    areas = np.zeros(n)
    perims = np.zeros(n)
    for i, poly in enumerate(regions):
        areas[i] = polygon_area(poly)
        perims[i] = polygon_perimeter(poly)

    # normalize
    def normalize(v):
        if v.max() == v.min():
            return np.zeros_like(v)
        return (v - v.min()) / (v.max() - v.min())

    return normalize(areas), normalize(perims)

def construct_adjacency_graph(vor, n_original):
    """
    Construct graph for the first n_original points.
    """
    G = nx.Graph()
    G.add_nodes_from(range(n_original))

    # ridge_points contains pairs of point indices
    for p1, p2 in vor.ridge_points:
        if p1 < n_original and p2 < n_original:
            G.add_edge(p1, p2)

    return G

# -------------------------
# Influence matrix M: site x neurotransmitter
# -------------------------
def influence_matrix(areas_n, perims_n, degrees, param_w):
    n = len(areas_n)
    m = len(param_w)
    M = np.zeros((n,m))
    for k, nt in enumerate(param_w.keys()):
        w0, wA, wP, wD = param_w[nt]
        # Avoid division by zero in degrees normalization
        deg_norm = degrees / np.maximum(1.0, degrees.max())
        M[:,k] = w0 + wA * areas_n + wP * perims_n + wD * deg_norm
    M = np.maximum(0.0, M)
    return M

# -------------------------
# Genetic Algorithm
# -------------------------
class Organism:
    def __init__(self, site_idx, genotype=None, size=1.0):
        self.site = site_idx
        self.genotype = genotype if genotype is not None else np.random.randn(6) * 0.1
        self.size = size
        self.alive = True

def initialize_population(n_sites, n_per_site=1):
    pop = []
    for i in range(n_sites):
        for j in range(n_per_site):
            pop.append(Organism(site_idx=i))
    return pop

def sigmoid(x):
    # Clip x to avoid overflow
    x = np.clip(x, -500, 500)
    return 1.0 / (1.0 + np.exp(-x))

def attempt_broadcast_and_reproduce(org, pool, M_row):
    if pool[2] < comm_cost_per_attempt:
        return None, False
    pool[2] -= comm_cost_per_attempt

    local_growth_influence = M_row[0]
    # Reproduction probability
    prob = sigmoid( (pool[0] / (1.0 + pool[0])) * local_growth_influence )

    if np.random.rand() > prob:
        return None, False

    g_use = min(pool[0], max(0.0, np.random.exponential(scale=1.0) * 0.2))
    pool[0] -= g_use

    child = Organism(site_idx=org.site, genotype=org.genotype.copy(), size=org.size/2.0)
    child.genotype += np.random.randn(*child.genotype.shape) * 0.05
    return child, True

def topology_aware_crossover(parent1, parent2):
    if np.random.rand() > crossover_rate:
        return None
    L_gen = len(parent1.genotype)
    cp = np.random.randint(1, L_gen)
    child_g = np.concatenate([parent1.genotype[:cp], parent2.genotype[cp:]])
    child = Organism(site_idx=parent1.site, genotype=child_g, size=(parent1.size+parent2.size)/2.0)
    return child

def enforce_prism_constraint(child, pts, prism_rect):
    x_min, x_max, y_min, y_max = prism_rect
    sx, sy = pts[child.site]
    if (x_min <= sx <= x_max) and (y_min <= sy <= y_max):
        return False
    return True

def run_ga_once(pts, regions, G_adj, param_w, pool_init, n_generations=10):
    pool = pool_init.copy()
    areas_n, perims_n = compute_site_features(regions)

    # Degrees
    degrees = np.zeros(len(pts))
    for i in range(len(pts)):
        degrees[i] = G_adj.degree(i) if i in G_adj else 0

    M = influence_matrix(areas_n, perims_n, degrees, param_w)
    pop = initialize_population(len(pts), n_per_site=pop_per_site)

    total_repro = 0
    violation_count = 0

    for gen in range(n_generations):
        np.random.shuffle(pop)
        new_offspring = []

        # Reproduction
        for org in pop:
            child, success = attempt_broadcast_and_reproduce(org, pool, M[org.site])
            if success and child is not None:
                if enforce_prism_constraint(child, pts, prism_rect):
                    new_offspring.append(child)
                    total_repro += 1
                else:
                    violation_count += 1

            # Crossover with neighbor
            if org.site in G_adj:
                neighs = list(G_adj.neighbors(org.site))
                if len(neighs) > 0 and np.random.rand() < 0.3:
                    nb_site = random.choice(neighs)
                    neighbor_orgs = [o for o in pop if o.site == nb_site]
                    if neighbor_orgs:
                        partner = random.choice(neighbor_orgs)
                        childc = topology_aware_crossover(org, partner)
                        if childc:
                            if enforce_prism_constraint(childc, pts, prism_rect):
                                new_offspring.append(childc)
                            # else: violation_count += 1 (optional counting)

        # Mutation
        for c in new_offspring:
            if np.random.rand() < mutation_rate:
                c.genotype += np.random.randn(*c.genotype.shape) * 0.1

        pop.extend(new_offspring)

        # Pool dynamics
        pool = pool * 0.99 + pool_init * 0.01
        if pool[0] > UEOPL_hard_limit:
            pool[0] = UEOPL_hard_limit

    mean_size = np.mean([o.size for o in pop]) if len(pop) > 0 else 0.0
    return {
        'total_repro': total_repro,
        'final_pop_size': len(pop),
        'mean_size': mean_size,
        'violations': violation_count
    }

def evaluate_param_setting(param_w, pts, regions, G_adj, pool_init, n_runs=3):
    summaries = []
    for _ in range(n_runs):
        s = run_ga_once(pts, regions, G_adj, param_w, pool_init, n_generations=n_generations)
        summaries.append(s)

    avg_total_repro = np.mean([s['total_repro'] for s in summaries])
    avg_violations = np.mean([s['violations'] for s in summaries])
    avg_pop = np.mean([s['final_pop_size'] for s in summaries])
    avg_mean_size = np.mean([s['mean_size'] for s in summaries])

    OPDC = avg_total_repro + 10.0 * avg_violations - 2.0 * avg_mean_size
    likelihood = np.exp(-beta_OPDC * OPDC)

    return likelihood, {
        'avg_total_repro': avg_total_repro,
        'avg_violations': avg_violations,
        'avg_pop': avg_pop,
        'avg_mean_size': avg_mean_size,
        'OPDC': OPDC
    }

# -------------------------
# MCMC Driver
# -------------------------
def main():
    print(f"Generating Voronoi for {N_sites} sites...")
    pts = sample_voronoi_points(N_sites, L)
    vor, regions = build_voronoi_regions_clipped(pts, L)
    G_adj = construct_adjacency_graph(vor, N_sites)

    # Baseline param_w
    param_w0 = {}
    for nt in nt_names:
        param_w0[nt] = np.array([0.1, 0.5*np.random.rand(), 0.3*np.random.rand(), 0.2*np.random.rand()])

    def pack_theta(param_w):
        arr = []
        for nt in nt_names:
            w0, wA, wP, wD = param_w[nt]
            arr.extend([wA, wP, wD])
        return np.array(arr)

    def unpack_theta(theta):
        param_w = {}
        for i, nt in enumerate(nt_names):
            wA, wP, wD = theta[3*i:3*i+3]
            param_w[nt] = np.array([0.1, wA, wP, wD])
        return param_w

    theta_current = pack_theta(param_w0)
    lik_current, diag_current = evaluate_param_setting(unpack_theta(theta_current), pts, regions, G_adj, pool_init, n_runs=seed_sim_per_mcmc)

    print(f"Initial Likelihood: {lik_current:.4e}, OPDC: {diag_current['OPDC']:.4f}")

    trace_theta = []
    trace_lik = []

    print(f"Running MCMC for {n_mcmc} steps...")
    # Using trange for progress bar
    for t in trange(n_mcmc):
        theta_prop = theta_current + np.random.randn(*theta_current.shape) * proposal_scale
        theta_prop = np.maximum(-1.0, theta_prop)

        lik_prop, diag_prop = evaluate_param_setting(unpack_theta(theta_prop), pts, regions, G_adj, pool_init, n_runs=seed_sim_per_mcmc)

        alpha = min(1.0, (lik_prop + 1e-12) / (lik_current + 1e-12))

        if np.random.rand() < alpha:
            theta_current = theta_prop
            lik_current = lik_prop
            diag_current = diag_prop

        trace_theta.append(theta_current.copy())
        trace_lik.append(lik_current)

    # Results
    trace_theta = np.array(trace_theta)
    theta_mean = trace_theta.mean(axis=0)

    print("\nPosterior mean parameters (wA, wP, wD):")
    for i, nt in enumerate(nt_names):
        wA, wP, wD = theta_mean[3*i:3*i+3]
        print(f"  {nt}: A={wA:.3f}, P={wP:.3f}, D={wD:.3f}")

    print(f"Final OPDC: {diag_current['OPDC']:.4f}")
    print("MCMC Complete. (Visualization skipped: matplotlib unavailable)")

if __name__ == "__main__":
    main()
