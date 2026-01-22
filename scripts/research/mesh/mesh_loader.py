"""
Parses MeSH Descriptor XML to build the initial candidate universe based on Tree Numbers.
"""
import xml.etree.cElementTree as ET
from . import config

class MeshLoader:
    def __init__(self, xml_path, logger):
        self.xml_path = xml_path
        self.logger = logger
        self.term_map = {} # UI -> Name
        self.tree_map = {} # UI -> [TreeNumbers]

    def load_descriptors(self):
        """
        Stream parses the MeSH XML to find terms belonging to target tree branches.
        """
        self.logger.info(f"Parsing MeSH Descriptors from {self.xml_path}...")
        
        context = ET.iterparse(self.xml_path, events=("end",))
        count = 0
        candidates = 0

        for event, elem in context:
            if elem.tag == "DescriptorRecord":
                ui = elem.find("DescriptorUI").text
                name = elem.find("DescriptorName/String").text
                
                tree_numbers = []
                tree_list = elem.find("TreeNumberList")
                if tree_list is not None:
                    tree_numbers = [t.text for t in tree_list.findall("TreeNumber")]

                # Check if this term belongs to our target domains
                is_candidate = False
                for tn in tree_numbers:
                    for prefix in config.TARGET_TREE_PREFIXES:
                        if tn.startswith(prefix):
                            is_candidate = True
                            break
                    if is_candidate:
                        break
                
                if is_candidate:
                    self.term_map[ui] = name
                    self.tree_map[ui] = tree_numbers
                    candidates += 1

                count += 1
                elem.clear()

        self.logger.info(f"Scanned {count} descriptors. Found {candidates} mental health candidates.")
        return self.term_map