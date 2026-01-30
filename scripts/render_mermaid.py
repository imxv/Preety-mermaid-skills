#!/usr/bin/env python3
"""
Render a Mermaid diagram as SVG or ASCII using beautiful-mermaid.

Usage:
    python render_mermaid.py --input diagram.mmd --output diagram.svg --format svg --theme tokyo-night
    python render_mermaid.py --input diagram.mmd --format ascii
"""

import argparse
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description='Render Mermaid diagrams as beautiful SVGs or ASCII art'
    )

    parser.add_argument(
        '--input', '-i',
        required=True,
        help='Input Mermaid file (.mmd)'
    )

    parser.add_argument(
        '--output', '-o',
        help='Output file (SVG or text). If omitted, prints to stdout'
    )

    parser.add_argument(
        '--format', '-f',
        choices=['svg', 'ascii'],
        default='svg',
        help='Output format (default: svg)'
    )

    parser.add_argument(
        '--theme', '-t',
        help='Built-in theme name (e.g., tokyo-night, dracula, github-dark)'
    )

    parser.add_argument(
        '--bg',
        help='Background color (hex)'
    )

    parser.add_argument(
        '--fg',
        help='Foreground color (hex)'
    )

    parser.add_argument(
        '--line',
        help='Edge/connector color (hex)'
    )

    parser.add_argument(
        '--accent',
        help='Arrow heads and highlights color (hex)'
    )

    parser.add_argument(
        '--muted',
        help='Secondary text and labels color (hex)'
    )

    parser.add_argument(
        '--surface',
        help='Node fill tint color (hex)'
    )

    parser.add_argument(
        '--border',
        help='Node stroke color (hex)'
    )

    parser.add_argument(
        '--font',
        default='Inter',
        help='Font family (default: Inter)'
    )

    parser.add_argument(
        '--transparent',
        action='store_true',
        help='Render with transparent background (SVG only)'
    )

    parser.add_argument(
        '--use-ascii',
        action='store_true',
        help='Use pure ASCII instead of Unicode (ASCII format only)'
    )

    parser.add_argument(
        '--padding-x',
        type=int,
        default=5,
        help='Horizontal spacing between nodes (ASCII only, default: 5)'
    )

    parser.add_argument(
        '--padding-y',
        type=int,
        default=5,
        help='Vertical spacing between nodes (ASCII only, default: 5)'
    )

    parser.add_argument(
        '--box-border-padding',
        type=int,
        default=1,
        help='Padding inside node boxes (ASCII only, default: 1)'
    )

    args = parser.parse_args()

    # Validate input file
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    # Build command
    helper_script = Path(__file__).parent / 'render_helper.mjs'
    cmd = ['node', str(helper_script), 'render', '--input', args.input]

    if args.output:
        cmd.extend(['--output', args.output])

    cmd.extend(['--format', args.format])

    if args.theme:
        cmd.extend(['--theme', args.theme])

    if args.bg:
        cmd.extend(['--bg', args.bg])

    if args.fg:
        cmd.extend(['--fg', args.fg])

    if args.line:
        cmd.extend(['--line', args.line])

    if args.accent:
        cmd.extend(['--accent', args.accent])

    if args.muted:
        cmd.extend(['--muted', args.muted])

    if args.surface:
        cmd.extend(['--surface', args.surface])

    if args.border:
        cmd.extend(['--border', args.border])

    if args.font:
        cmd.extend(['--font', args.font])

    if args.transparent:
        cmd.extend(['--transparent', 'true'])

    if args.use_ascii:
        cmd.extend(['--use-ascii', 'true'])

    cmd.extend(['--padding-x', str(args.padding_x)])
    cmd.extend(['--padding-y', str(args.padding_y)])
    cmd.extend(['--box-border-padding', str(args.box_border_padding)])

    # Execute
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"Error: {result.stderr}", file=sys.stderr)
            sys.exit(result.returncode)

        print(result.stdout)

    except FileNotFoundError:
        print("Error: Node.js not found. Please install Node.js to use this tool.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
