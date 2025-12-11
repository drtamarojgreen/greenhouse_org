from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath('docs/genetic.html')
        page.goto(f'file://{file_path}')

        print("Page loaded. Waiting for simulation to be ready...")

        # Wait for the simulation container and the start button
        page.wait_for_selector('#genetic-start-overlay button', timeout=10000)
        print("Simulation ready. Clicking start button.")
        page.click('#genetic-start-overlay button')

        # Wait for the canvas to be interactive
        page.wait_for_selector('canvas', timeout=5000)
        time.sleep(2) # Allow time for initial rendering

        def get_camera_states():
            """Helper function to retrieve camera states from the page."""
            return page.evaluate("""() => {
                const main_camera = window.GreenhouseGeneticUI3D.mainCameraController.camera;
                const pip_controls = window.GreenhouseGeneticPiPControls.controllers;
                return {
                    main: {
                        x: main_camera.x,
                        y: main_camera.y,
                        z: main_camera.z,
                        rotationX: main_camera.rotationX,
                        rotationY: main_camera.rotationY
                    },
                    pip_helix: {
                        zoom: pip_controls.helix.camera.zoom,
                        rotationX: pip_controls.helix.camera.rotationX,
                        rotationY: pip_controls.helix.camera.rotationY
                    },
                    pip_micro: {
                        zoom: pip_controls.micro.camera.zoom,
                        rotationX: pip_controls.micro.camera.rotationX,
                        rotationY: pip_controls.micro.camera.rotationY
                    }
                };
            }""")

        # --- Step 1: Get Initial State ---
        print("\n--- CAPTURING INITIAL CAMERA STATE ---")
        initial_states = get_camera_states()
        print("Initial States:", initial_states)
        page.screenshot(path='verification/debug_01_initial_state.png')
        print("Saved screenshot: verification/debug_01_initial_state.png")

        # --- Step 2: Interact with Main Camera ---
        print("\n--- INTERACTING WITH MAIN CAMERA ---")
        canvas_bb = page.locator('canvas').bounding_box()
        page.mouse.move(canvas_bb['x'] + canvas_bb['width'] / 2, canvas_bb['y'] + canvas_bb['height'] / 2)
        page.mouse.down()
        page.mouse.move(canvas_bb['x'] + canvas_bb['width'] / 2 + 100, canvas_bb['y'] + canvas_bb['height'] / 2, steps=5)
        page.mouse.up()
        time.sleep(1) # Wait for animation to settle

        states_after_main_drag = get_camera_states()
        print("States after Main Drag:", states_after_main_drag)
        page.screenshot(path='verification/debug_02_after_main_drag.png')
        print("Saved screenshot: verification/debug_02_after_main_drag.png")


        # --- Step 3: Interact with PiP Camera (Helix, top-left) ---
        print("\n--- INTERACTING WITH HELIX PIP CAMERA ---")
        # PiP is at (10, 10) with size 200x150
        pip_x = canvas_bb['x'] + 10
        pip_y = canvas_bb['y'] + 10

        print("\n[PiP Interaction] State BEFORE mousedown:")
        print(get_camera_states())

        page.mouse.move(pip_x + 50, pip_y + 50)
        page.mouse.down()
        time.sleep(0.1)

        print("\n[PiP Interaction] State AFTER mousedown:")
        print(get_camera_states())

        page.mouse.move(pip_x + 100, pip_y + 50, steps=5)
        time.sleep(0.1)

        print("\n[PiP Interaction] State AFTER mousemove (dragging):")
        print(get_camera_states())

        page.mouse.up()
        time.sleep(0.1)

        print("\n[PiP Interaction] State IMMEDIATELY AFTER mouseup:")
        print(get_camera_states())

        time.sleep(1)

        final_states = get_camera_states()
        print("\n[PiP Interaction] FINAL state after 1s delay:")
        print("Final States:", final_states)
        page.screenshot(path='verification/debug_03_final_state.png')
        print("Saved screenshot: verification/debug_03_final_state.png")

        browser.close()
        print("\nDebugging script finished.")

if __name__ == "__main__":
    run()
