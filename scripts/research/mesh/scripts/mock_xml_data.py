import gzip
import os
import xml.etree.ElementTree as ET

def create_mock_mesh_xml(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    root = ET.Element("DescriptorRecordSet")

    terms = [
        ("D003863", "Depressive Disorder", ["F03.600.300"]),
        ("D001007", "Anxiety Disorders", ["F03.080"]),
        ("D008603", "Mental Health", ["F01.145.560"]),
        ("D000067697", "Telemedicine", ["G11.427.640"]),
        ("D006331", "Heart Diseases", ["C14.280"]),
    ]

    for ui, name, trees in terms:
        record = ET.SubElement(root, "DescriptorRecord")
        ET.SubElement(record, "DescriptorUI").text = ui
        name_elem = ET.SubElement(record, "DescriptorName")
        ET.SubElement(name_elem, "String").text = name
        tree_list = ET.SubElement(record, "TreeNumberList")
        for t in trees:
            ET.SubElement(tree_list, "TreeNumber").text = t

    tree = ET.ElementTree(root)
    tree.write(path, encoding="UTF-8", xml_declaration=True)
    print(f"Mock MeSH XML created at {path}")

def create_mock_pubmed_gz(path, start_year=1965, end_year=2024):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    root = ET.Element("PubmedArticleSet")

    terms_uis = ["D003863", "D001007", "D008603", "D000067697", "D006331"]

    for year in range(start_year, end_year + 1):
        for _ in range(5): # 5 articles per year
            article = ET.SubElement(root, "PubmedArticle")
            medline = ET.SubElement(article, "MedlineCitation")
            article_meta = ET.SubElement(medline, "Article")
            journal = ET.SubElement(article_meta, "Journal")
            journal_issue = ET.SubElement(journal, "JournalIssue")
            pub_date = ET.SubElement(journal_issue, "PubDate")
            ET.SubElement(pub_date, "Year").text = str(year)

            mesh_list = ET.SubElement(medline, "MeshHeadingList")
            # Randomly assign 2 terms
            import random
            selected = random.sample(terms_uis, 2)
            for ui in selected:
                heading = ET.SubElement(mesh_list, "MeshHeading")
                descriptor = ET.SubElement(heading, "DescriptorName")
                descriptor.set("UI", ui)
                descriptor.text = "Some Term Name"

    xml_str = ET.tostring(root, encoding="UTF-8")
    with gzip.open(path, 'wb') as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write(xml_str)
    print(f"Mock PubMed GZ created at {path}")

if __name__ == "__main__":
    create_mock_mesh_xml("data/desc2024.xml")
    create_mock_pubmed_gz("data/pubmed_baseline/sample.xml.gz")
