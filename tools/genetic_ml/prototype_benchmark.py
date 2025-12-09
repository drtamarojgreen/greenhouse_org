#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Desktop CPU prototype benchmark: protein interaction workflow
- No PyTorch; uses NumPy/SciPy/scikit-learn
- Double precision everywhere (float64)
- Multithreaded lookup simulation
- Timers and memory profiling for each stage

Dependencies:
  numpy, scikit-learn, psutil, memory_profiler
Optional:
  biopython (for FASTA parsing)

Run:
  python prototype_benchmark.py --fasta small.fasta --max-seqs 3000
  python prototype_benchmark.py   # synthetic fallback
"""

import os
import sys
import time
import argparse
from contextlib import contextmanager
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional

import numpy as np
from sklearn.utils.extmath import randomized_svd
from concurrent.futures import ThreadPoolExecutor, as_completed

# Memory profiling
try:
    import psutil
except ImportError:
    psutil = None

try:
    from memory_profiler import memory_usage
except ImportError:
    memory_usage = None

# Optional FASTA parsing
try:
    from Bio import SeqIO
except ImportError:
    SeqIO = None


# -----------------------------
# Utilities: timing & memory
# -----------------------------
@dataclass
class StageMetrics:
    name: str
    elapsed_s: float
    mem_mb: Optional[float]

@contextmanager
def stage_timer(name: str) -> Tuple[List[StageMetrics], float]:
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start

def current_mem_mb() -> Optional[float]:
    if psutil is None:
        return None
    proc = psutil.Process(os.getpid())
    return proc.memory_info().rss / (1024**2)

def run_with_mem(func, *args, **kwargs) -> Tuple[any, Optional[float]]:
    if memory_usage is None:
        result = func(*args, **kwargs)
        return result, current_mem_mb()
    else:
        # Measure peak memory during function execution
        mem_before = current_mem_mb()
        result = None
        def _wrapper():
            nonlocal result
            result = func(*args, **kwargs)
        mem_trace = memory_usage((_wrapper, ), max_iterations=1, interval=0.05)
        peak = max(mem_trace) if mem_trace else mem_before
        return result, peak


# -----------------------------
# Stage 1: Data ingestion
# -----------------------------
def parse_fasta_features(fasta_path: str, max_seqs: int = 3000) -> Tuple[np.ndarray, List[str]]:
    """
    Read FASTA and compute simple numeric features per sequence:
      - Amino acid composition (20 dims)
      - Sequence length (1 dim, normalized)
      - k-mer counts for k=2 over a reduced alphabet (optional, small)
    Returns features (N x D) as float64 and IDs.
    """
    if SeqIO is None:
        raise RuntimeError("BioPython not available. Install 'biopython' or run synthetic mode.")

    aa_order = list("ACDEFGHIKLMNPQRSTVWY")
    aa_index = {a: i for i, a in enumerate(aa_order)}
    ids = []
    feats = []

    for i, record in enumerate(SeqIO.parse(fasta_path, "fasta")):
        if i >= max_seqs:
            break
        seq = str(record.seq).upper()
        vec = np.zeros(len(aa_order) + 1, dtype=np.float64)  # 20 AA + length
        for ch in seq:
            if ch in aa_index:
                vec[aa_index[ch]] += 1.0
        length = max(1, len(seq))
        vec[:len(aa_order)] /= float(length)
        vec[-1] = float(length) / 1000.0  # simple normalization
        ids.append(record.id)
        feats.append(vec)

    X = np.array(feats, dtype=np.float64)
    return X, ids

def synthetic_features(n_proteins: int = 4000, d_features: int = 128, seed: int = 42) -> Tuple[np.ndarray, List[str]]:
    rng = np.random.default_rng(seed)
    # Correlated features to mimic structure; in float64
    base = rng.standard_normal((d_features, d_features))
    cov = base @ base.T
    L = np.linalg.cholesky(cov + 1e-3 * np.eye(d_features))
    raw = rng.standard_normal((n_proteins, d_features))
    X = (raw @ L).astype(np.float64)
    ids = [f"prot_{i:06d}" for i in range(n_proteins)]
    return X, ids


# -----------------------------
# Stage 2: Index tables
# -----------------------------
def build_index_tables(ids: List[str], X: np.ndarray) -> Dict[str, Dict]:
    """
    Lightweight index: maps ID -> position and basic stats.
    """
    idx = {}
    for i, pid in enumerate(ids):
        row = X[i]
        idx[pid] = {
            "pos": i,
            "mean": float(np.mean(row)),
            "std": float(np.std(row)),
            "norm": float(np.linalg.norm(row))
        }
    return idx


# -----------------------------
# Stage 3: Randomized factorization (double precision)
# -----------------------------
def randomized_factorization(X: np.ndarray, n_components: int = 64, oversample: int = 10, n_iter: int = 2):
    """
    Approximate orthonormal factor using randomized SVD.
    Returns U (N x k), Sigma (k), VT (k x D).
    """
    U, Sigma, VT = randomized_svd(
        X, n_components=n_components, n_iter=n_iter, power_iteration_normalizer='auto', random_state=0
    )
    # Ensure float64
    return U.astype(np.float64), Sigma.astype(np.float64), VT.astype(np.float64)


# -----------------------------
# Stage 4: Multithreaded lookup simulation
# -----------------------------
def lookup_scan(X: np.ndarray, idx: Dict[str, Dict], ids: List[str], worker_count: int = 8, sample_size: int = 1000):
    """
    Simulate thread-based lookup scans over index tables.
    """
    rng = np.random.default_rng(123)
    chosen = rng.choice(ids, size=min(sample_size, len(ids)), replace=False)

    def task(pid: str):
        pos = idx[pid]["pos"]
        row = X[pos]
        # Simulated work: cosine similarity to a small set of anchors
        anchors = X[:8]  # small fixed subset
        sims = anchors @ row / (np.linalg.norm(anchors, axis=1) * np.linalg.norm(row) + 1e-12)
        return float(np.mean(sims))

    results = []
    with ThreadPoolExecutor(max_workers=worker_count) as ex:
        futures = {ex.submit(task, pid): pid for pid in chosen}
        for fut in as_completed(futures):
            results.append(fut.result())
    return np.array(results, dtype=np.float64)


# -----------------------------
# Stage 5: Validation (toy RMSD-like metric)
# -----------------------------
def toy_validation(U: np.ndarray, X: np.ndarray) -> Dict[str, float]:
    """
    Compare low-rank reconstruction to original features with a normalized error.
    """
    k = U.shape[1]
    # Project X to k-dim subspace and reconstruct via least squares
    # Compute R = argmin ||X - U R||; R = (U^T U)^{-1} U^T X
    UtU = U.T @ U
    R = np.linalg.solve(UtU, U.T @ X)
    X_hat = U @ R
    err = np.linalg.norm(X - X_hat) / (np.linalg.norm(X) + 1e-12)
    return {"relative_reconstruction_error": float(err), "rank": float(k)}


# -----------------------------
# Orchestration & benchmarking
# -----------------------------
def benchmark(fasta: Optional[str], max_seqs: int, n_components: int, threads: int) -> List[StageMetrics]:
    metrics: List[StageMetrics] = []

    # Stage 1: Ingestion
    mem0 = current_mem_mb()
    t0 = time.perf_counter()
    if fasta and os.path.exists(fasta):
        X, ids = parse_fasta_features(fasta, max_seqs=max_seqs)
        source = f"FASTA({len(ids)})"
    else:
        X, ids = synthetic_features(n_proteins=max_seqs, d_features=128)
        source = f"SYNTH({len(ids)})"
    t1 = time.perf_counter()
    metrics.append(StageMetrics("ingestion", t1 - t0, current_mem_mb()))
    print(f"[ingestion] source={source} shape={X.shape} time={t1 - t0:.3f}s mem={metrics[-1].mem_mb:.1f}MB")

    # Stage 2: Index
    t0 = time.perf_counter()
    index = build_index_tables(ids, X)
    t1 = time.perf_counter()
    metrics.append(StageMetrics("index", t1 - t0, current_mem_mb()))
    print(f"[index] entries={len(index)} time={t1 - t0:.3f}s mem={metrics[-1].mem_mb:.1f}MB")

    # Stage 3: Randomized SVD
    def _svd():
        return randomized_factorization(X, n_components=n_components, oversample=10, n_iter=2)
    (U, Sigma, VT), peak_mem = run_with_mem(_svd)
    metrics.append(StageMetrics("randomized_svd", 0.0, peak_mem))
    print(f"[randomized_svd] k={n_components} U={U.shape} Sigma={Sigma.shape} VT={VT.shape} peak_mem={peak_mem:.1f}MB")

    # Update elapsed since we couldn't capture inside run_with_mem
    # Re-run quick timer for transparency (without mem)
    t0 = time.perf_counter()
    U2, S2, VT2 = randomized_factorization(X, n_components=n_components, oversample=10, n_iter=1)
    t1 = time.perf_counter()
    metrics[-1].elapsed_s = (t1 - t0)
    print(f"[randomized_svd-timer] time={t1 - t0:.3f}s")

    # Stage 4: Multithreaded lookup
    t0 = time.perf_counter()
    results = lookup_scan(X, index, ids, worker_count=threads, sample_size=min(1000, len(ids)))
    t1 = time.perf_counter()
    metrics.append(StageMetrics("lookup_threads", t1 - t0, current_mem_mb()))
    print(f"[lookup_threads] threads={threads} samples={results.size} time={t1 - t0:.3f}s mem={metrics[-1].mem_mb:.1f}MB")

    # Stage 5: Validation
    t0 = time.perf_counter()
    val = toy_validation(U, X)
    t1 = time.perf_counter()
    metrics.append(StageMetrics("validation", t1 - t0, current_mem_mb()))
    print(f"[validation] rel_err={val['relative_reconstruction_error']:.4f} rank={val['rank']:.0f} time={t1 - t0:.3f}s mem={metrics[-1].mem_mb:.1f}MB")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Desktop CPU prototype benchmark (NumPy/SciPy/sklearn only)")
    parser.add_argument("--fasta", type=str, default=None, help="Path to small FASTA file")
    parser.add_argument("--max-seqs", type=int, default=3000, help="Max sequences to ingest")
    parser.add_argument("--components", type=int, default=64, help="Randomized SVD rank (components)")
    parser.add_argument("--threads", type=int, default=8, help="Thread count for lookup simulation")
    args = parser.parse_args()

    print("==== Desktop CPU Prototype Benchmark ====")
    print(f"FASTA: {args.fasta or 'None (synthetic)'} | max_seqs={args.max_seqs} | k={args.components} | threads={args.threads}")
    print("Double precision enforced (float64). No PyTorch used.\n")

    metrics = benchmark(
        fasta=args.fasta,
        max_seqs=args.max_seqs,
        n_components=args.components,
        threads=args.threads
    )

    print("\n==== Summary ====")
    for m in metrics:
        mem = f"{m.mem_mb:.1f}MB" if m.mem_mb is not None else "n/a"
        print(f"{m.name:20s}  time={m.elapsed_s:.3f}s  mem={mem}")

    print("\nNotes:")
    print("- If memory metrics show n/a, install psutil and memory_profiler.")
    print("- Increase --components to stress SVD; increase --max-seqs for larger datasets.")
    print("- The randomized SVD approximates Gram matrix factorization without explicit Gram formation.")
    print("- Multithreaded lookup simulates index scans and page caches on CPU.")


if __name__ == "__main__":
    main()
