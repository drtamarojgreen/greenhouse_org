import subprocess
import os
import sys

def run_audit():
    # Detect the script path and master script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    master_script = os.path.join(script_dir, "silent_movie_generator.py")
    audit_dir = os.path.join(script_dir, "renders", "audit_stills")
    
    # Ensure audit directory exists
    os.makedirs(audit_dir, exist_ok=True)

    print(f"--- Greenhouse Silent Movie Audit ---")
    print(f"Goal: Render every 100th frame from 1 to 10000.")
    print(f"Target Directory: {audit_dir}\n")

    for frame in range(1, 10001, 100):
        # We use a unique prefix for each frame to keep them organized
        # blender -b <script> -- [args]
        output_path = os.path.join(audit_dir, f"audit_frame_{frame:04d}_")
        
        cmd = [
            "blender", 
            "--background", 
            "--python", master_script, 
            "--", # Arguments after -- go to our script's main()
            "--frame", str(frame),
            "--render-output", output_path
        ]
        
        print(f"Rendering frame {frame:04d}...")
        try:
            # Point 63: Use a log file instead of DEVNULL to capture errors
            log_file = os.path.join(audit_dir, f"render_{frame:04d}.log")
            with open(log_file, "w") as f:
                subprocess.run(cmd, check=True, stdout=f, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            print(f"ERROR: Failed to render frame {frame}. Command: {' '.join(cmd)}")
            continue
    
    print(f"\nAudit complete. {len(range(1, 10001, 100))} stills generated in {audit_dir}.")

if __name__ == "__main__":
    run_audit()
