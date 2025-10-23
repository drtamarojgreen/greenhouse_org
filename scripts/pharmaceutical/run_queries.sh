#!/usr/bin/env bash

# Automated SPARQL Query Runner for Fuseki
# This script runs a series of advanced, cross-dataset queries.

set -e # Exit immediately on error

# ==============================
# CONFIGURATION
# ==============================
FUSEKI_URL="http://localhost:3030/spl/query"
OUT_DIR="./results"

echo "Creating results directory: $OUT_DIR"
mkdir -p "$OUT_DIR"

# ==============================
# DEFINE SPARQL QUERIES
# ==============================

# Query 1: Find drugs with "Priority" review status that mention "anxiety" or "depression" in their labels.
# This demonstrates linking Drugs@FDA data (ReviewPriority) with SPL data (paragraph text).
query_priority_mental_health=$(cat <<'EOF'
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX fda: <http://www.fda.gov/drugsatfda/>
PREFIX rdfs: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?drugName ?sponsor ?reviewPriority ?paragraph
WHERE {
  # Find applications with a Priority review status
  ?app a fda:Application ;
       fda:reviewPriority ?reviewPriority ;
       fda:sponsorName ?sponsor ;
       fda:hasProduct ?product .

  # Get the drug name from the product
  ?product fda:drugName ?drugName .

  # Link to the SPL data via the application number in the SPL's dc:source
  ?spl dc:source ?app_id ;
       dc:paragraph ?paragraph .

  # The dc:source is the AppNo, which we can use to reconstruct the application URI
  BIND(IRI(CONCAT("http://www.fda.gov/drugsatfda/application/", STR(?app_id))) as ?app)

  # Filter for relevant keywords and Priority status
  FILTER (regex(lcase(str(?paragraph)), "anxiety|depression"))
  FILTER (lcase(str(?reviewPriority)) = "priority")
}
ORDER BY ?drugName
LIMIT 100
EOF
)

# Query 2: Identify sponsors who have more than 5 drugs that mention "serotonin syndrome".
# This shows aggregation and linking across the datasets.
query_sponsor_serotonin_focus=$(cat <<'EOF'
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX fda: <http://www.fda.gov/drugsatfda/>

SELECT ?sponsor (COUNT(DISTINCT ?drugName) as ?drugCount)
WHERE {
  ?app a fda:Application ;
       fda:sponsorName ?sponsor ;
       fda:hasProduct ?product .

  ?product fda:drugName ?drugName .

  ?spl dc:source ?app_id ;
       dc:paragraph ?paragraph .

  BIND(IRI(CONCAT("http://www.fda.gov/drugsatfda/application/", STR(?app_id))) as ?app)

  FILTER(regex(lcase(str(?paragraph)), "serotonin syndrome"))
}
GROUP BY ?sponsor
HAVING (COUNT(DISTINCT ?drugName) > 5)
ORDER BY DESC(?drugCount)
EOF
)


# Query 3: List all active ingredients for drugs whose labels mention "suicidal ideation".
query_ingredients_suicide_risk=$(cat <<'EOF'
PREFIX dc: <http://purl.org/dc/elements/1.1/>
PREFIX fda: <http://www.fda.gov/drugsatfda/>

SELECT DISTINCT ?drugName ?activeIngredient
WHERE {
  ?app a fda:Application ;
       fda:hasProduct ?product .

  ?product fda:drugName ?drugName ;
           fda:activeIngredient ?activeIngredient .

  ?spl dc:source ?app_id ;
       dc:paragraph ?paragraph .

  BIND(IRI(CONCAT("http://www.fda.gov/drugsatfda/application/", STR(?app_id))) as ?app)

  FILTER(regex(lcase(str(?paragraph)), "suicidal ideation"))
}
ORDER BY ?drugName
LIMIT 200
EOF
)

# ==============================
# RUN SPARQL QUERIES
# ==============================

declare -A QUERIES=(
    ["priority_mental_health.csv"]="$query_priority_mental_health"
    ["sponsor_serotonin_focus.csv"]="$query_sponsor_serotonin_focus"
    ["ingredients_suicide_risk.csv"]="$query_ingredients_suicide_risk"
)

# Check if Fuseki is available
if ! curl -s --head "$FUSEKI_URL" | head -n 1 | grep "200 OK" > /dev/null; then
    echo "Error: Fuseki server is not responding at $FUSEKI_URL"
    echo "Please ensure your Fuseki server is running and the data has been loaded."
    exit 1
fi

for file in "${!QUERIES[@]}"; do
    echo "Running query and saving results to $file..."
    curl -s -X POST \
        -H "Accept: text/csv" \
        -H "Content-Type: application/sparql-query" \
        --data-binary "${QUERIES[$file]}" \
        "$FUSEKI_URL" > "$OUT_DIR/$file"
    echo "Results for $file saved in $OUT_DIR."
done

echo "All queries have been executed."