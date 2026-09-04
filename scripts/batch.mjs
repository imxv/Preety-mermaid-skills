#!/usr/bin/env node

import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { DEFAULT_PNG_WIDTH, parsePngWidth, renderSvgToPng } from './png.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillRoot = join(__dirname, '..');

function toAsciiTheme(colors) {
  if (!colors) return undefined;

  const border = colors.border ?? colors.fg;
  const line = colors.line ?? colors.fg;
  const arrow = colors.accent ?? colors.line ?? colors.fg;
  const corner = colors.border ?? colors.line ?? colors.fg;
  const junction = colors.accent ?? colors.border ?? colors.line ?? colors.fg;

  return {
    ...(colors.fg && { fg: colors.fg }),
    ...(border && { border }),
    ...(line && { line }),
    ...(arrow && { arrow }),
    ...(colors.accent && { accent: colors.accent }),
    ...(colors.bg && { bg: colors.bg }),
    ...(corner && { corner }),
    ...(junction && { junction }),
  };
}

async function loadBeautifulMermaid() {
  try {
    return await import('beautiful-mermaid');
  } catch {}

  console.error('[beautiful-mermaid] Dependency not found. Installing automatically...');
  try {
    execSync('npm install --no-fund --no-audit', {
      cwd: skillRoot,
      stdio: ['pipe', 'pipe', 'inherit'],
      timeout: 120000,
    });
    console.error('[beautiful-mermaid] Installed successfully.\n');
  } catch (e) {
    console.error(`[beautiful-mermaid] Auto-install failed: ${e.message}`);
    console.error(`Manual fix: cd ${skillRoot} && npm install`);
    process.exit(1);
  }

  try {
    const pkgPath = join(skillRoot, 'node_modules', 'beautiful-mermaid', 'dist', 'index.js');
    return await import(pkgPath);
  } catch (e) {
    console.error(`[beautiful-mermaid] Failed to load after install: ${e.message}`);
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    inputDir: null,
    outputDir: null,
    format: 'svg',
    theme: null,
    bg: null,
    fg: null,
    line: null,
    accent: null,
    muted: null,
    surface: null,
    border: null,
    font: 'Inter',
    transparent: false,
    useAscii: false,
    paddingX: 5,
    paddingY: 5,
    boxBorderPadding: 1,
    colorMode: 'auto',
    padding: 40,
    nodeSpacing: 24,
    layerSpacing: 40,
    componentSpacing: 24,
    interactive: false,
    force: false,
    workers: 4,
    width: DEFAULT_PNG_WIDTH,
  };

  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const val = args[i + 1];

    switch (key) {
      case '--input-dir': case '-i': opts.inputDir = val; i++; break;
      case '--output-dir': case '-o': opts.outputDir = val; i++; break;
      case '--format': case '-f': opts.format = val; i++; break;
      case '--theme': case '-t': opts.theme = val; i++; break;
      case '--bg': opts.bg = val; i++; break;
      case '--fg': opts.fg = val; i++; break;
      case '--line': opts.line = val; i++; break;
      case '--accent': opts.accent = val; i++; break;
      case '--muted': opts.muted = val; i++; break;
      case '--surface': opts.surface = val; i++; break;
      case '--border': opts.border = val; i++; break;
      case '--font': opts.font = val; i++; break;
      case '--transparent': opts.transparent = true; break;
      case '--use-ascii': opts.useAscii = true; break;
      case '--padding-x': opts.paddingX = parseInt(val); i++; break;
      case '--padding-y': opts.paddingY = parseInt(val); i++; break;
      case '--box-border-padding': opts.boxBorderPadding = parseInt(val); i++; break;
      case '--color-mode': opts.colorMode = val; i++; break;
      case '--padding': opts.padding = parseInt(val); i++; break;
      case '--node-spacing': opts.nodeSpacing = parseInt(val); i++; break;
      case '--layer-spacing': opts.layerSpacing = parseInt(val); i++; break;
      case '--component-spacing': opts.componentSpacing = parseInt(val); i++; break;
      case '--interactive': opts.interactive = true; break;
      case '--force': opts.force = true; break;
      case '--workers': case '-w': opts.workers = parseInt(val); i++; break;
      case '--width':
        if (val === undefined) throw new Error('--width requires a value.');
        opts.width = val; i++; break;
      case '--help': case '-h':
        console.log(`Usage: node batch.mjs --input-dir <dir> --output-dir <dir> [options]

Options:
  -i, --input-dir <dir>    Input directory containing .mmd files [required]
  -o, --output-dir <dir>   Output directory for rendered files [required]
      --force              Overwrite existing output files (default: refuse)
  -f, --format <fmt>       Output format: svg | png | ascii (default: svg)
  -t, --theme <name>       Theme name (e.g. tokyo-night, dracula)
      --bg <hex>           Background color
      --fg <hex>           Foreground color
      --line <hex>         Edge/connector color
      --accent <hex>       Arrow heads and highlights color
      --muted <hex>        Secondary text color
      --surface <hex>      Node fill tint color
      --border <hex>       Node stroke color
      --font <name>        Font family (default: Inter)
      --transparent        Transparent background (SVG and PNG)
      --width <n>          PNG width in pixels (100-10000, default: 800)
      --use-ascii          Pure ASCII instead of Unicode (ASCII only)
      --padding-x <n>      Horizontal spacing (ASCII only, default: 5)
      --padding-y <n>      Vertical spacing (ASCII only, default: 5)
      --box-border-padding <n>  Padding inside node boxes (ASCII only, default: 1)
      --color-mode <mode>  ASCII colors: none | auto | ansi16 | ansi256 | truecolor | html
      --padding <n>        SVG canvas padding in px (default: 40)
      --node-spacing <n>   SVG horizontal node spacing (default: 24)
      --layer-spacing <n>  SVG vertical layer spacing (default: 40)
      --component-spacing <n>  SVG disconnected component spacing (default: 24)
      --interactive        Enable XY chart hover tooltips (SVG only)
  -w, --workers <n>        Parallel workers (default: 4)`);
        process.exit(0);
    }
  }

  if (!opts.inputDir) {
    console.error('Error: --input-dir is required. Use --help for usage.');
    process.exit(1);
  }
  if (!opts.outputDir) {
    console.error('Error: --output-dir is required. Use --help for usage.');
    process.exit(1);
  }
  if (!existsSync(opts.inputDir)) {
    console.error(`Error: Input directory not found: ${opts.inputDir}`);
    process.exit(1);
  }

  if (!['svg', 'png', 'ascii'].includes(opts.format)) {
    console.error(`Error: Unsupported format: ${opts.format}. Use svg, png, or ascii.`);
    process.exit(1);
  }

  if (opts.format === 'png') {
    opts.width = parsePngWidth(opts.width);
  }

  return opts;
}

function writeRendered(outputPath, content, force) {
  // 'wx' = exclusive create: the no-overwrite check and the write are one atomic
  // step, so a concurrent process cannot slip a file into the TOCTOU window.
  try {
    writeFileSync(outputPath, content, { flag: force ? 'w' : 'wx' });
  } catch (e) {
    if (e.code === 'EEXIST') {
      throw new Error(`Output file already exists: ${outputPath} (pass --force to replace)`);
    }
    throw e;
  }
}

async function renderFile(file, inputDir, outputDir, opts, lib) {
  const { renderMermaidSVG, renderMermaidASCII, THEMES } = lib;
  const inputPath = join(inputDir, file);
  const ext = opts.format === 'svg' ? '.svg' : opts.format === 'png' ? '.png' : '.txt';
  const outputPath = join(outputDir, file.replace(/\.mmd$/, ext));
  const input = readFileSync(inputPath, 'utf8');
  const theme = opts.theme ? THEMES[opts.theme] : undefined;
  const customColors = {
    ...(opts.bg && { bg: opts.bg }),
    ...(opts.fg && { fg: opts.fg }),
    ...(opts.line && { line: opts.line }),
    ...(opts.accent && { accent: opts.accent }),
    ...(opts.border && { border: opts.border }),
  };
  const asciiColors = theme || (Object.keys(customColors).length > 0 ? customColors : undefined);

  if (opts.format === 'ascii') {
    const ascii = renderMermaidASCII(input, {
      useAscii: opts.useAscii,
      paddingX: opts.paddingX,
      paddingY: opts.paddingY,
      boxBorderPadding: opts.boxBorderPadding,
      colorMode: opts.colorMode,
      theme: toAsciiTheme(asciiColors),
    });
    writeRendered(outputPath, ascii, opts.force);
  } else {
    const colors = theme || {
      ...(opts.bg && { bg: opts.bg }),
      ...(opts.fg && { fg: opts.fg }),
      ...(opts.line && { line: opts.line }),
      ...(opts.accent && { accent: opts.accent }),
      ...(opts.muted && { muted: opts.muted }),
      ...(opts.surface && { surface: opts.surface }),
      ...(opts.border && { border: opts.border }),
    };

    const svg = renderMermaidSVG(input, {
      ...colors,
      font: opts.font,
      transparent: opts.transparent,
      padding: opts.padding,
      nodeSpacing: opts.nodeSpacing,
      layerSpacing: opts.layerSpacing,
      componentSpacing: opts.componentSpacing,
      interactive: opts.interactive,
    });
    writeRendered(outputPath, opts.format === 'png' ? renderSvgToPng(svg, opts.width) : svg, opts.force);
  }
}

async function main() {
  const opts = parseArgs();
  const lib = await loadBeautifulMermaid();

  if (opts.theme && !Object.prototype.hasOwnProperty.call(lib.THEMES, opts.theme)) {
    throw new Error(`Unknown theme: ${opts.theme}. Run node scripts/themes.mjs to list themes.`);
  }

  mkdirSync(opts.outputDir, { recursive: true });

  const files = readdirSync(opts.inputDir).filter(f => f.endsWith('.mmd'));
  if (files.length === 0) {
    console.error(`No .mmd files found in ${opts.inputDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} diagram(s) to render...`);

  let success = 0;
  const failed = [];

  // Process in batches of `workers` size
  for (let i = 0; i < files.length; i += opts.workers) {
    const batch = files.slice(i, i + opts.workers);
    const results = await Promise.allSettled(
      batch.map(file => renderFile(file, opts.inputDir, opts.outputDir, opts, lib))
    );

    results.forEach((result, idx) => {
      const file = batch[idx];
      if (result.status === 'fulfilled') {
        console.log(`\u2713 ${file}`);
        success++;
      } else {
        console.error(`\u2717 ${file}: ${result.reason?.message || result.reason}`);
        failed.push([file, result.reason?.message || String(result.reason)]);
      }
    });
  }

  console.log(`\n${success}/${files.length} diagrams rendered successfully`);

  if (failed.length > 0) {
    console.error(`\n${failed.length} failed:`);
    for (const [file, error] of failed) {
      console.error(`  - ${file}: ${error}`);
    }
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
