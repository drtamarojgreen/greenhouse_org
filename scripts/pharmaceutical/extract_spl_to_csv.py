import os
import re
import glob
import pandas as pd
from lxml import etree

# ------------------------------
# Base path containing directories
# ------------------------------
base_path = "."  # change to the parent folder where directories are

# ------------------------------
# Pattern for directories: 20250801_<UUID>
# ------------------------------
pattern = re.compile(r"^20250801_[0-9a-fA-F\-]{36}$")

# ------------------------------
# Find matching directories
# ------------------------------
directories = [
    d for d in os.listdir(base_path)
    if os.path.isdir(os.path.join(base_path, d)) and pattern.match(d)
]

print(f"Found {len(directories)} matching directories.")

# ------------------------------
# Namespace map for SPL XML
# ------------------------------
ns = {'hl7': 'urn:hl7-org:v3'}

# ------------------------------
# Data storage
# ------------------------------
records = []

# ------------------------------
# Scan directories and XML files
# ------------------------------
for dir_path in directories:
    xml_files = glob.glob(os.path.join(base_path, dir_path, "*.xml"))

    for xml_file in xml_files:
        try:
            tree = etree.parse(xml_file)
        except Exception as e:
            print(f"Error parsing {xml_file}: {e}")
            continue

        # ----------------------
        # Extract product name
        # ----------------------
        product_name_nodes = tree.xpath(
            ".//hl7:manufacturedProduct/hl7:manufacturedProduct/hl7:name",
            namespaces=ns
        )
        product_name = product_name_nodes[0].text if product_name_nodes else None

        # ----------------------
        # Extract sections and paragraphs
        # ----------------------
        section_nodes = tree.xpath(".//hl7:section", namespaces=ns)
        for sec in section_nodes:
            title_nodes = sec.xpath("./hl7:title", namespaces=ns)
            title = title_nodes[0].text if title_nodes else None

            paragraph_nodes = sec.xpath(".//hl7:paragraph", namespaces=ns)
            paragraphs = [p.text for p in paragraph_nodes if p.text]

            for para in paragraphs:
                records.append({
                    "file": os.path.basename(xml_file),
                    "product_name": product_name,
                    "section": title,
                    "paragraph": para
                })

# ------------------------------
# Create DataFrame and save CSV
# ------------------------------
df = pd.DataFrame(records)
df.to_csv("spl_products_sections.csv", index=False)
print(f"Saved {len(df)} records to spl_products_sections.csv")