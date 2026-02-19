import bpy
import sys
import os
import mathutils

# Setup path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import assets.greenhouse_interior as gi

def test_isolated_creation():
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    print("Testing Potted Plant...")
    plant = gi.create_potted_plant((0,0,0), plant_type='FERN', name="TestPlant")
    if not plant:
        print("FAIL: Plant is None")
    elif plant.type != 'MESH':
         print(f"FAIL: Plant is not mesh, it is {plant.type}")
    else:
        print(f"PASS: Plant created as {plant.name} with {len(plant.data.vertices)} verts")
        
    print("Testing Potting Bench...")
    bench = gi.create_potting_bench((2,0,0), name="TestBench")
    if not bench:
        print("FAIL: Bench is None")
    else:
        print(f"PASS: Bench created as {bench.name} with {len(bench.data.vertices)} verts")

    print("Testing Hanging Basket...")
    basket = gi.create_hanging_basket((0,2,0), name="TestBasket")
    if not basket:
        print("FAIL: Basket is None")
    else:
         print(f"PASS: Basket created as {basket.name} with {len(basket.data.vertices)} verts")

if __name__ == "__main__":
    test_isolated_creation()
