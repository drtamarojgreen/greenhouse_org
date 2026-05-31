#!/bin/bash

DIRS=("docs/js/" "scripts/research/mesh/" "scripts/blender/movie/")

echo "Detailed Violation Report"
echo "========================="

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        continue
    fi

    echo "### Directory: $dir"

    echo "#### Violations"
    echo "##### Empty Catch Blocks"
    grep -rnEi "catch\s*\([^)]*\)\s*\{\s*\}" "$dir" --include="*.js" --include="*.py" || echo "None found."

    echo "##### Meaningless Assertions"
    grep -rnEi "assert\s*\(\s*(true|1|!false|!!true)\s*\)" "$dir" --include="*.js" --include="*.py" || echo "None found."

    echo "##### Raw Pointer / Manual Management Patterns"
    # Limit output as there are hundreds in docs/js/
    grep -rnEi "\b(new\s+[^\(;]+|delete\s+[^;]+)\b" "$dir" --include="*.js" --include="*.py" | head -n 50
    COUNT=$(grep -rnEi "\b(new\s+[^\(;]+|delete\s+[^;]+)\b" "$dir" --include="*.js" --include="*.py" | wc -l)
    if [ "$COUNT" -gt 50 ]; then echo "... and $((COUNT - 50)) more."; fi

    echo "##### Magic Placeholders"
    grep -rnEi "\"(test|dummy|example|placeholder|stub)\"" "$dir" --include="*.js" --include="*.py" || echo "None found."

    echo "##### Magic Numbers"
    grep -rnEi "=\s*(42|123|999|0xDEADBEEF|0xCAFEBABE)\b" "$dir" --include="*.js" --include="*.py" || echo "None found."

    echo "#### Waste Markers"
    grep -rnEi "TODO|FIXME|Implement .* logic|Your logic here|Add implementation|// \.\.\.|\/\* \.\.\. \*\/|return \{\}; // placeholder|as an AI language model|certainly, I can help" "$dir" --include="*.js" --include="*.py" | head -n 50
    W_COUNT=$(grep -rnEi "TODO|FIXME|Implement .* logic|Your logic here|Add implementation|// \.\.\.|\/\* \.\.\. \*\/|return \{\}; // placeholder|as an AI language model|certainly, I can help" "$dir" --include="*.js" --include="*.py" | wc -l)
    if [ "$W_COUNT" -gt 50 ]; then echo "... and $((W_COUNT - 50)) more."; fi

    echo "-------------------------"
done
