import os
import subprocess
import sys

def run_tests():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tests_dir = os.path.join(script_dir, "tests")

    test_files = [
        "test_render_preparedness.py",
        "test_blender_5_0_features.py",
        "test_interaction_scene.py",
        "test_asset_details.py"
    ]

    print(f"--- Running Greenhouse Blender Movie Test Suite ---")

    all_passed = True
    for test_file in test_files:
        test_path = os.path.join(tests_dir, test_file)
        if not os.path.exists(test_path):
            print(f"ERROR: Test file not found: {test_file}")
            continue

        print(f"\n>> Running {test_file}...")

        # Command to run blender in background and execute the test script
        cmd = [
            "blender",
            "--background",
            "--python", test_path
        ]

        try:
            # We don't use stdout=DEVNULL because we want to see the test results
            result = subprocess.run(cmd, check=False, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"PASS: {test_file}")
                # Print the summary from the script's output if available
                if "SUMMARY" in result.stdout:
                    summary_lines = result.stdout.split("SUMMARY")[1].split("="*50)[0]
                    print(summary_lines)
            else:
                print(f"FAIL: {test_file}")
                print(result.stdout)
                print(result.stderr)
                all_passed = False
        except FileNotFoundError:
            print("ERROR: 'blender' command not found. Skipping execution.")
            all_passed = False
            break

    if all_passed:
        print("\nOVERALL STATUS: ALL TESTS PASSED")
        return 0
    else:
        print("\nOVERALL STATUS: SOME TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
