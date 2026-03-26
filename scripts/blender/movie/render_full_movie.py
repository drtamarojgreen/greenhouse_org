from render_manager import render_range
import os

import sys
from concurrent.futures import ThreadPoolExecutor # Point 69
import monitor
import threading

def render_full_movie(sequel=False, parallel=False, test_range=None):
    script_name = "sequel_generator.py" if sequel else "silent_movie_generator.py"
    title = f"Test Range {test_range}" if test_range else ("Sequel" if sequel else "Full Movie")
    
    if test_range:
        start_f, end_f = map(int, test_range.split("-"))
        total_frames = end_f - start_f + 1
        chunk_size = 2 # Small chunks for test parallelization
        range_start = start_f
    else:
        total_frames = 6000 if sequel else 15000
        chunk_size = 200
        range_start = 1

    print(f"Starting {title} Render ({total_frames} frames) using {script_name} (parallel={parallel})...")

    chunks = []
    for start in range(range_start, range_start + total_frames, chunk_size):
        end = min(start + chunk_size - 1, range_start + total_frames - 1)
        # Point 155: Use dedicated test_render directory
        subdir = f"test_render_{start}_{end}" if test_range else (f"{'sequel' if sequel else 'full_movie'}/chunk_{start:04d}_{end:04d}")
        chunks.append((start, end, subdir))

    device = 'HIP' # Default for Ryzen/Vega system
    if "--cpu" in sys.argv: device = 'CPU'

    max_workers = 2 # Conservative default for Ryzen 3
    if "--workers" in sys.argv:
        try: max_workers = int(sys.argv[sys.argv.index("--workers") + 1])
        except: pass

    if parallel:
        print(f"Parallel Mode: Using {max_workers} workers")
        # Start monitor in background
        monitor_thread = threading.Thread(target=monitor.monitor_process, kwargs={'duration_seconds': 600}, daemon=True)
        monitor_thread.start()

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for start, end, subdir in chunks:
                futures.append(executor.submit(render_range, start, end, subdir, master_script_name=script_name, device_type=device))
            
            # Wait for all to complete
            for future in futures:
                future.result()
    else:
        for start, end, subdir in chunks:
            render_range(start, end, subdir, master_script_name=script_name, device_type=device)

    print(f"{title} Render sequence complete.")

if __name__ == "__main__":
    sequel_mode = "--sequel" in sys.argv
    parallel_mode = "--parallel" in sys.argv
    
    # Point 155: Add test range support for verification
    test_r = None
    if "--test-range" in sys.argv:
        try:
            test_r = sys.argv[sys.argv.index("--test-range") + 1]
        except (ValueError, IndexError):
            print("Usage: --test-range START-END")
            sys.exit(1)

    render_full_movie(sequel=sequel_mode, parallel=parallel_mode, test_range=test_r)
