#!/usr/bin/env node

import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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
    input: null,
    output: null,
    force: false,
    format: 'svg',
    theme: null,
    bg: null,
    fg: null,
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
    width: DEFAULT_PNG_WIDTH,
  };

  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const val = args[i + 1];

    switch (key) {
      case '--input': case '-i': opts.input = val; i++; break;
      case '--output': case '-o': opts.output = val; i++; break;
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
      case '--force': opts.force = true; break;
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
      case '--width':
        if (val === undefined) throw new Error('--width requires a value.');
        opts.width = val; i++; break;
      case '--help': case '-h':
        console.log(`Usage: node render.mjs --input <file> [options]

Options:
  -i, --input <file>       Input Mermaid file (.mmd) [required]
  -o, --output <file>      Output file (default: <input>.svg/.txt/.png by format)
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
      --interactive        Enable XY chart hover tooltips (SVG only)`);
        process.exit(0);
    }
  }

  if (!opts.input) {
    console.error('Error: --input is required. Use --help for usage.');
    process.exit(1);
  }

  if (!existsSync(opts.input)) {
    console.error(`Error: Input file not found: ${opts.input}`);
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

function defaultOutputPath(input, ext) {
  return /\.mmd$/i.test(input) ? input.replace(/\.mmd$/i, `.${ext}`) : `${input}.${ext}`;
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

async function main() {
  const opts = parseArgs();
  const { renderMermaidSVG, renderMermaidASCII, THEMES } = await loadBeautifulMermaid();
  const input = readFileSync(opts.input, 'utf8');

  if (opts.theme && !Object.prototype.hasOwnProperty.call(THEMES, opts.theme)) {
    throw new Error(`Unknown theme: ${opts.theme}. Run node scripts/themes.mjs to list themes.`);
  }
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
    const outputPath = opts.output || defaultOutputPath(opts.input, 'txt');
    writeRendered(outputPath, ascii, opts.force);
    console.log(`ASCII diagram saved to ${outputPath}`);
  } else {
    const colors = theme || {
      bg: opts.bg ?? '#FFFFFF',
      fg: opts.fg ?? '#27272A',
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

    const ext = opts.format === 'png' ? 'png' : 'svg';
    const outputPath = opts.output || defaultOutputPath(opts.input, ext);
    const content = opts.format === 'png' ? renderSvgToPng(svg, opts.width) : svg;
    writeRendered(outputPath, content, opts.force);
    console.log(`${opts.format.toUpperCase()} diagram saved to ${outputPath}`);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
