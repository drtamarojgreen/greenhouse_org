
import bpy
import json
import argparse
import sys

def get_argv():
    """
    Get the arguments passed to the script.
    Blender's Python interpreter does not use sys.argv directly,
    so we need to parse them from the command line arguments.
    """
    argv = sys.argv
    if "--" in argv:
        return argv[argv.index("--") + 1:]
    else:
        return []

def decimate_objects(config_path, output_blend_path, report_path):
    """
    Applies decimation to mesh objects in the current Blender scene based on a configuration file.
    """
    try:
        with open(config_path, 'r') as f:
            policy = json.load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in configuration file at {config_path}")
        sys.exit(1)

    report = {
        "input_blend": bpy.data.filepath,
        "output_blend": output_blend_path,
        "policy": policy,
        "objects": []
    }

    for obj in bpy.data.objects:
        if obj.type != 'MESH':
            report["objects"].append({
                "name": obj.name,
                "type": obj.type,
                "action": "skipped_non_mesh"
            })
            continue

        n_verts = len(obj.data.vertices)
        min_vertices = policy.get("min_vertices", 0)

        if n_verts < min_vertices:
            report["objects"].append({
                "name": obj.name,
                "type": "MESH",
                "vertices_before": n_verts,
                "action": "skipped_too_small"
            })
            continue

        ratio = policy.get("default_ratio", 0.5)
        if "per_object" in policy and obj.name in policy["per_object"]:
            ratio = policy["per_object"][obj.name].get("ratio", ratio)

        mod = obj.modifiers.new(name="AUTO_DECIMATE", type='DECIMATE')
        mod.ratio = ratio

        action = "decimated"
        if policy.get("apply_modifier", False):
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=mod.name)
            action = "decimated_and_applied"

        report["objects"].append({
            "name": obj.name,
            "type": "MESH",
            "vertices_before": n_verts,
            "vertices_after": len(obj.data.vertices),
            "ratio": ratio,
            "action": action
        })

    bpy.ops.wm.save_as_mainfile(filepath=output_blend_path)

    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"Decimation complete. Report saved to {report_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply decimation to a Blender file.")
    parser.add_argument("--config", dest="config_path", required=True, help="Path to the decimation policy JSON file.")
    parser.add_argument("--output-blend", dest="output_blend_path", required=True, help="Path to save the decimated .blend file.")
    parser.add_argument("--report", dest="report_path", required=True, help="Path to save the JSON report.")

    args = parser.parse_args(get_argv())

    decimate_objects(args.config_path, args.output_blend_path, args.report_path)
