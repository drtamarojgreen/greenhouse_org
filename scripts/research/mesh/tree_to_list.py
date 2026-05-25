#!/usr/bin/env python3

import re
import sys


def clean_line(line: str) -> str:
    """
    Removes tree formatting and trailing parenthetical metadata.

    Examples removed:
        (33209)
        (pruned: 0)
        (ref)
        (??)
    """

    # Remove tree drawing characters and leading indentation
    line = re.sub(r'^[\s│├└─]+', '', line)

    # Remove trailing parenthetical expressions
    line = re.sub(r'\s*\([^)]*\)\s*$', '', line)

    return line.strip()


def process_file(input_file: str, output_file: str):
    cleaned_lines = []

    with open(input_file, 'r', encoding='utf-8') as infile:
        for raw_line in infile:
            line = clean_line(raw_line)

            # Skip empty lines
            if line:
                cleaned_lines.append(line)

    with open(output_file, 'w', encoding='utf-8') as outfile:
        for line in cleaned_lines:
            outfile.write(line + '\n')


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 tree_to_list.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    process_file(input_file, output_file)

    print(f"Processed '{input_file}' -> '{output_file}'")


if __name__ == "__main__":
    main()