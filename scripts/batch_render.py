#!/usr/bin/env python3
"""
Batch render multiple Mermaid diagrams.

Usage:
    python batch_render.py --input-dir ./diagrams --output-dir ./output --format svg --theme tokyo-night
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed


def render_file(input_file, output_dir, args):
    """Render a single Mermaid file."""
    output_ext = '.svg' if args.format == 'svg' else '.txt'
    output_file = output_dir / (input_file.stem + output_ext)

    # Build command
    helper_script = Path(__file__).parent / 'render_helper.mjs'
    cmd = [
        'node', str(helper_script), 'render',
        '--input', str(input_file),
        '--output', str(output_file),
        '--format', args.format
    ]

    if args.theme:
        cmd.extend(['--theme', args.theme])

    if args.bg:
        cmd.extend(['--bg', args.bg])

    if args.fg:
        cmd.extend(['--fg', args.fg])

    if args.transparent:
        cmd.extend(['--transparent', 'true'])

    if args.use_ascii:
        cmd.extend(['--use-ascii', 'true'])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return (input_file.name, True, None)
        else:
            return (input_file.name, False, result.stderr)
    except Exception as e:
        return (input_file.name, False, str(e))


def main():
    parser = argparse.ArgumentParser(
        description='Batch render Mermaid diagrams'
    )

    parser.add_argument(
        '--input-dir', '-i',
        required=True,
        help='Input directory containing .mmd files'
    )

    parser.add_argument(
        '--output-dir', '-o',
        required=True,
        help='Output directory for rendered files'
    )

    parser.add_argument(
        '--format', '-f',
        choices=['svg', 'ascii'],
        default='svg',
        help='Output format (default: svg)'
    )

    parser.add_argument(
        '--theme', '-t',
        help='Built-in theme name'
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
        '--workers', '-w',
        type=int,
        default=4,
        help='Number of parallel workers (default: 4)'
    )

    args = parser.parse_args()

    # Validate input directory
    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"Error: Input directory not found: {args.input_dir}", file=sys.stderr)
        sys.exit(1)

    # Check for Node.js dependency
    if not shutil.which('node'):
        print("Error: Node.js is required but not found in PATH.", file=sys.stderr)
        sys.exit(1)

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Find all .mmd files
    mmd_files = list(input_dir.glob('*.mmd'))

    if not mmd_files:
        print(f"No .mmd files found in {args.input_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(mmd_files)} diagram(s) to render...")

    # Render in parallel
    success_count = 0
    failed = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(render_file, mmd_file, output_dir, args): mmd_file
            for mmd_file in mmd_files
        }

        for future in as_completed(futures):
            filename, success, error = future.result()
            if success:
                print(f"✓ {filename}")
                success_count += 1
            else:
                print(f"✗ {filename}: {error}", file=sys.stderr)
                failed.append((filename, error))

    # Summary
    print(f"\n{success_count}/{len(mmd_files)} diagrams rendered successfully")

    if failed:
        print(f"\n{len(failed)} failed:")
        for filename, error in failed:
            print(f"  - {filename}: {error}")
        sys.exit(1)


if __name__ == '__main__':
    main()
