import subprocess
import os

def generate_credits_from_git():
    """Point 80: Automated Credit Generation from Git Log."""
    try:
        result = subprocess.run(['git', 'log', '--format=%aN'], capture_output=True, text=True)
        contributors = sorted(list(set(result.stdout.splitlines())))

        credits_text = "GREENHOUSE MD\n\nCONTRIBUTORS:\n"
        credits_text += "\n".join(contributors)

        with open("renders/credits.txt", 'w') as f:
            f.write(credits_text)
        print("Credits generated from git log.")
    except Exception as e:
        print(f"Failed to generate credits: {e}")

if __name__ == "__main__":
    generate_credits_from_git()
