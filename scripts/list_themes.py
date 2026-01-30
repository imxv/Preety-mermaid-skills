#!/usr/bin/env python3
"""
List all available beautiful-mermaid themes.

Usage:
    python list_themes.py
"""

import subprocess
import json
import sys
from pathlib import Path


def main():
    helper_script = Path(__file__).parent / 'render_helper.mjs'
    cmd = ['node', str(helper_script), 'list-themes']

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"Error: {result.stderr}", file=sys.stderr)
            sys.exit(1)

        themes = json.loads(result.stdout)

        print("Available Beautiful-Mermaid Themes:\n")
        for i, theme in enumerate(themes, 1):
            print(f"{i:2d}. {theme}")

        print(f"\nTotal: {len(themes)} themes")
        print("\nUsage:")
        print("  python render_mermaid.py --input diagram.mmd --theme <theme-name> --output output.svg")

    except FileNotFoundError:
        print("Error: Node.js not found. Please install Node.js to use this tool.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print("Error: Could not parse theme list", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
