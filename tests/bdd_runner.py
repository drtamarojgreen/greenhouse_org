
import unittest
import os
import re
import logging
from selenium import webdriver
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Step Registry ---
_step_registry = {}

def step_decorator(registry, pattern):
    def decorator(func):
        logging.info(f"Registering step: '{pattern}'")
        registry[pattern] = func
        return func
    return decorator

# --- BDD Parser and Runner ---
class BDDTestRunner:
    def __init__(self, features_dir, steps_dir):
        self.features_dir = features_dir
        self.steps_dir = steps_dir

    def run_tests(self):
        suite = unittest.TestSuite()
        for feature_filename in os.listdir(self.features_dir):
            if feature_filename.endswith('.feature'):
                feature_path = os.path.join(self.features_dir, feature_filename)
                test_case_class = self.create_test_case_class(feature_path)
                suite.addTest(unittest.TestLoader().loadTestsFromTestCase(test_case_class))
        
        runner = unittest.TextTestRunner()
        runner.run(suite)

    def create_test_case_class(self, feature_path):
        with open(feature_path, 'r') as f:
            feature_content = f.read()

        feature_name = os.path.basename(feature_path).replace('.feature', '')
        class_name = f'Test{feature_name.replace(" ", "").title().replace(" ", "")}'

        class BDDTestCase(unittest.TestCase):
            driver = None
            _step_registry = _step_registry

            @classmethod
            def setUpClass(cls):
                # The user mentioned geckodriver in test/
                geckodriver_path = '/home/tamarojgreen/development/LLM/greenhouse_org/test/geckodriver'
                
                options = Options()
                options.add_argument("-headless")

                if os.path.exists(geckodriver_path):
                    service = FirefoxService(executable_path=geckodriver_path)
                    cls.driver = webdriver.Firefox(service=service, options=options)
                else:
                    raise FileNotFoundError(f"GeckoDriver not found at {geckodriver_path}")
                cls.driver.implicitly_wait(10)

            @classmethod
            def tearDownClass(cls):
                if cls.driver:
                    cls.driver.quit()

            def _execute_step(self, step_text):
                step_text = re.sub(r'^(Given|When|Then|And|But) ', '', step_text).strip()
                found_match = False
                for pattern, func in self._step_registry.items():
                    # Ensure the pattern matches the step_text (without Given/When/Then)
                    match = re.match(pattern, step_text)
                    if match:
                        func(self, *match.groups())
                        found_match = True
                        break
                if not found_match:
                    self.skipTest(f"Step not defined: {step_text}")

        scenarios = re.findall(r'Scenario: (.*)', feature_content)
        steps_by_scenario = re.split(r'Scenario: .*', feature_content)[1:]

        for i, scenario_name in enumerate(scenarios):
            test_method_name = f'test_{scenario_name.lower().replace(" ", "_")}'
            
            def create_test_method(steps_text):
                def test_method(self):
                    steps = [s.strip() for s in steps_text.strip().split('\n') if s.strip()]
                    for step_line in steps:
                        # Remove Given/When/Then/And/But
                        stripped_step_line = re.sub(r'^(Given|When|Then|And|But) ', '', step_line).strip()
                        self._execute_step(stripped_step_line)
                return test_method

            steps_for_scenario = steps_by_scenario[i]
            test_method = create_test_method(steps_for_scenario)
            setattr(BDDTestCase, test_method_name, test_method)

        BDDTestCase.__name__ = class_name
        return BDDTestCase

def register_all_steps(registry):
    # Explicitly import and register steps from each module
    from tests.bdd.steps import books_steps
    from tests.bdd.steps import videos_steps
    from tests.bdd.steps import news_steps
    from tests.bdd.steps import common_steps
    from tests.bdd.steps import schedule_steps

    books_steps.register_steps(registry)
    videos_steps.register_steps(registry)
    news_steps.register_steps(registry)
    common_steps.register_steps(registry)
    schedule_steps.register_steps(registry)

if __name__ == '__main__':
    # Add tests directory to path to allow importing steps
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
    register_all_steps(_step_registry) # Register all steps into the global _step_registry

    runner = BDDTestRunner('tests/bdd/features', 'tests/bdd/steps')
    runner.run_tests()
