import csv
import os
import re

# Directory containing your CSV files
input_dir = "input_csvs"
output_dir = "output_csvs"
os.makedirs(output_dir, exist_ok=True)

# Fields to extract
TITLE_FIELD = "Video Title (Original)"
DESC_FIELD = "Video Description (Original)"

# Function to clean description
def clean_description(text):
    lines = text.splitlines()
    cleaned_lines = []

    for line in lines:
        lower_line = line.lower()
        if "welcome to the greenhouse" in lower_line:
            # Keep only the part before the phrase
            index = lower_line.find("welcome to the greenhouse")
            cleaned_lines.append(line[:index].strip())
            break  # Stop processing after this line
        else:
            cleaned_lines.append(line.strip())

    # Join and clean
    cleaned = " ".join(cleaned_lines)

    # Remove emojis
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"
        "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF"
        "\U00002700-\U000027BF"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    cleaned = emoji_pattern.sub("", cleaned)

    # Remove bracketed metadata and normalize whitespace
    cleaned = re.sub(r'\[.*?\]', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)

    return cleaned.strip()


# Process each CSV file in the input directory
for filename in os.listdir(input_dir):
    if filename.endswith(".csv"):
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, f"cleaned_{filename}")

        with open(input_path, newline='', encoding='utf-8') as infile, \
             open(output_path, "w", newline='', encoding='utf-8') as outfile:

            reader = csv.DictReader(infile, quotechar='"', skipinitialspace=True)
            writer = csv.writer(outfile, quoting=csv.QUOTE_ALL)
            writer.writerow(["Video Title", "Video Description"])

            for row in reader:
                title = row.get(TITLE_FIELD, "").strip()
                desc = row.get(DESC_FIELD, "")
                cleaned_desc = clean_description(desc)
                writer.writerow([title, cleaned_desc])

print("✅ All files processed. Cleaned CSVs saved to:", output_dir)

