import numpy as np
import uuid
import random

class NeurotransmitterPool:
    def __init__(self, growth, energy, communication):
        self.growth = growth
        self.energy = energy
        self.communication = communication
        self.initial_growth = growth

class Organism:
    def __init__(self, center, dimension_n, parent_id=None):
        self.id = uuid.uuid4()
        self.center = np.array(center, dtype=float)
        self.dimension_n = dimension_n
        self.parent_id = parent_id
        self.children_ids = []
        self.alive = True
        self.has_reproduced_once = False
        self.intent_broadcast = False

    @property
    def cube_bounds(self):
        # Returns (min_coords, max_coords)
        return (self.center - self.dimension_n, self.center + self.dimension_n)

    def intersects(self, other_center, other_n):
        # Check intersection with another cube defined by center and n
        my_min, my_max = self.cube_bounds
        other_min = other_center - other_n
        other_max = other_center + other_n

        return np.all(my_min < other_max) and np.all(other_min < my_max)

class Simulation:
    def __init__(self, n=1.0, alpha=1.0, majority_frac=0.5, comm_cost=1.0, energy_cost_base=1.0):
        self.n = n
        self.alpha = alpha
        self.majority_frac = majority_frac
        self.comm_cost = comm_cost
        self.energy_cost_base = energy_cost_base

        self.organisms = []
        self.pool = None
        self.ancestors_cubes = [] # List of (center, dimension_n) tuples

    def initialize_world(self, initial_pool_growth=100.0, initial_pool_energy=100.0, initial_pool_comm=100.0):
        self.pool = NeurotransmitterPool(initial_pool_growth, initial_pool_energy, initial_pool_comm)

        # Initialize two siblings as per pseudocode: (-n, 0, 0) and (n, 0, 0)
        # Note: Prompt text mentioned 0 and 2n, but pseudocode said -n and n.
        # Using -n and n keeps them symmetric around 0.

        sibling_a = Organism([-self.n, 0, 0], self.n)
        sibling_b = Organism([self.n, 0, 0], self.n)

        self.organisms = [sibling_a, sibling_b]
        self.ancestors_cubes.append((sibling_a.center, sibling_a.dimension_n))
        self.ancestors_cubes.append((sibling_b.center, sibling_b.dimension_n))

    def can_occupy_position(self, center, n):
        # Check against all ancestor cubes
        for anc_center, anc_n in self.ancestors_cubes:
            # Check intersection
            min_a = anc_center - anc_n
            max_a = anc_center + anc_n
            min_b = center - n
            max_b = center + n

            if np.all(min_a < max_b) and np.all(min_b < max_a):
                return False
        return True

    def reproduction_probability(self, org):
        # Logistic function based on pool resources
        # w_g * G + w_e * E + w_c * C
        # Simple weights
        score = (self.pool.growth / (1 + self.pool.growth)) + \
                (self.pool.energy / (1 + self.pool.energy)) + \
                (self.pool.communication / (1 + self.pool.communication))

        return 1.0 / (1.0 + np.exp(-1.0 * (score - 1.5)))

    def broadcast_intent(self, org):
        if self.pool.communication < self.comm_cost:
            return False
        self.pool.communication -= self.comm_cost
        org.intent_broadcast = True
        return True

    def choose_direction(self, org):
        # If original sibling and first reproduction, must be away from other sibling
        if org.parent_id is None and not org.has_reproduced_once:
            # Assuming siblings are on X axis at -n and n
            if org.center[0] < 0:
                return np.array([-1.0, 0.0, 0.0]) # Left
            else:
                return np.array([1.0, 0.0, 0.0]) # Right

        # Otherwise random direction (or strategic inward)
        # For simulation, let's pick a random direction
        vec = np.random.randn(3)
        vec /= np.linalg.norm(vec)
        return vec

    def step(self):
        # Phase A: Intents
        for org in self.organisms:
            if not org.alive: continue

            p_intent = self.reproduction_probability(org)
            if random.random() < p_intent:
                self.broadcast_intent(org)

        # Phase B: Reproduction
        candidates = [org for org in self.organisms if org.intent_broadcast]
        random.shuffle(candidates)

        new_children = []

        for org in candidates:
            # Check majority requirement
            if self.pool.growth <= self.majority_frac * self.pool.initial_growth:
                org.intent_broadcast = False
                continue

            # Original sibling limit
            if org.parent_id is None and org.has_reproduced_once:
                 org.intent_broadcast = False
                 continue

            # Stochastic reproduction success
            p_repro = self.reproduction_probability(org)
            if random.random() > p_repro:
                org.intent_broadcast = False
                continue

            # Allocate growth
            # Simple policy: use 10% of available growth or at least enough for min distance
            g_avail = self.pool.growth
            g_used = g_avail * 0.1

            d = self.alpha * g_used

            # Distance constraint: > 2n
            min_dist = 2 * org.dimension_n + 0.01
            if d < min_dist:
                # Force usage if pool allows?
                # Or fail?
                # Let's try to grab enough
                req_g = min_dist / self.alpha
                if self.pool.growth >= req_g:
                    g_used = req_g
                    d = min_dist
                else:
                    # Failed to get enough growth
                    org.intent_broadcast = False
                    continue

            direction = self.choose_direction(org)
            child_center = org.center + direction * d
            child_n = org.dimension_n / 2.0

            if self.can_occupy_position(child_center, child_n):
                # Create child
                child = Organism(child_center, child_n, parent_id=org.id)
                new_children.append(child)
                self.ancestors_cubes.append((child.center, child.dimension_n))

                self.pool.growth -= g_used

                # Energy cost
                e_used = self.energy_cost_base # Simplified
                self.pool.energy = max(0, self.pool.energy - e_used)

                if org.parent_id is None:
                    org.has_reproduced_once = True

            org.intent_broadcast = False

        self.organisms.extend(new_children)

    def run(self, steps=100):
        print(f"Starting simulation with {len(self.organisms)} organisms.")
        for i in range(steps):
            self.step()
            if i % 10 == 0:
                print(f"Step {i}: {len(self.organisms)} organisms. Pool: G={self.pool.growth:.2f}, E={self.pool.energy:.2f}, C={self.pool.communication:.2f}")

if __name__ == "__main__":
    sim = Simulation(n=10.0, alpha=1.0)
    sim.initialize_world(initial_pool_growth=500.0, initial_pool_energy=200.0, initial_pool_comm=100.0)
    sim.run(steps=50)
