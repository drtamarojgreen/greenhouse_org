"""
Streaming parser for PubMed XML (.gz) files. 
Designed to be run in parallel processes.
"""
import gzip
import xml.etree.cElementTree as ET
import os
from collections import Counter

class PubMedParser:
    def __init__(self, allowed_mesh_uis=None):
        """
        :param allowed_mesh_uis: Set of MeSH UIs (strings) to filter for. 
                                 If None, parses all.
        """
        self.allowed_mesh_uis = set(allowed_mesh_uis) if allowed_mesh_uis else None

    def parse_file(self, filepath):
        """
        Parses a single .xml.gz file and returns aggregated counts.
        Returns: dict { (mesh_ui, year): count }
        """
        local_counts = Counter()
        
        try:
            with gzip.open(filepath, 'rb') as f:
                context = ET.iterparse(f, events=("end",))
                
                for event, elem in context:
                    if elem.tag == "PubmedArticle":
                        self._process_article(elem, local_counts)
                        elem.clear()
        except Exception as e:
            print(f"Error parsing {filepath}: {e}")
            
        return local_counts

    def _process_article(self, article_elem, counter):
        # 1. Extract Year
        year = None
        
        # Try PubDate first
        pub_date = article_elem.find(".//PubDate")
        if pub_date is not None:
            year_elem = pub_date.find("Year")
            if year_elem is not None:
                year = year_elem.text
        
        # Fallback to ArticleDate
        if not year:
            article_date = article_elem.find(".//ArticleDate")
            if article_date is not None:
                year_elem = article_date.find("Year")
                if year_elem is not None:
                    year = year_elem.text

        # Fallback to DateCompleted
        if not year:
            date_completed = article_elem.find(".//DateCompleted")
            if date_completed is not None:
                year_elem = date_completed.find("Year")
                if year_elem is not None:
                    year = year_elem.text

        if not year or not str(year).isdigit():
            return

        year = int(year)

        # 2. Extract MeSH Terms
        mesh_list = article_elem.find(".//MeshHeadingList")
        if mesh_list is not None:
            for heading in mesh_list.findall("MeshHeading"):
                descriptor = heading.find("DescriptorName")
                if descriptor is not None:
                    ui = descriptor.get("UI")
                    
                    # Filter: Only count if it's in our candidate list
                    if self.allowed_mesh_uis and ui not in self.allowed_mesh_uis:
                        continue
                    
                    counter[(ui, year)] += 1