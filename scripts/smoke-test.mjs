#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderMermaidASCII,
  renderMermaidSVG,
  THEMES,
} from 'beautiful-mermaid';
import { parsePngWidth, prepareSvgForPng, renderSvgForPng, renderSvgToPng } from './png.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(scriptsDir, '..', 'assets', 'example_diagrams');
const files = readdirSync(examplesDir).filter(file => file.endsWith('.mmd')).sort();
const inheritedThemeNames = ['toString', 'constructor', '__proto__'];
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

assert.equal(files.length, 6, 'Expected six example diagrams');
assert.equal(Object.keys(THEMES).length, 15, 'Expected 15 built-in themes');

for (const file of files) {
  const source = readFileSync(join(examplesDir, file), 'utf8');
  const svg = renderMermaidSVG(source, THEMES['tokyo-night']);
  const ascii = renderMermaidASCII(source, { colorMode: 'none' });
  const preparedSvg = prepareSvgForPng(svg).svg;
  const png = renderSvgToPng(svg, 320);

  assert.ok(svg.startsWith('<svg'), `${file} did not render valid SVG`);
  assert.ok(ascii.trim().length > 0, `${file} did not render ASCII output`);
  assert.doesNotMatch(preparedSvg, /(?:var|color-mix)\s*\(/, `${file} retained unsupported CSS`);
  assert.ok(png.subarray(0, 8).equals(pngSignature), `${file} did not render valid PNG`);
  assert.equal(png.readUInt32BE(16), 320, `${file} PNG width was not applied`);
}

assert.throws(() => parsePngWidth('800; echo unsafe'), /PNG width must be an integer/);
assert.throws(() => parsePngWidth(99), /PNG width must be an integer/);

const cssLikeLabelSvg = renderMermaidSVG('flowchart LR\n  A["var(--user-label)"] --> B["color-mix(in srgb, red, blue)"]');
const cssLikeLabelPrepared = prepareSvgForPng(cssLikeLabelSvg).svg;
assert.match(cssLikeLabelPrepared, /var\(--user-label\)/);
assert.match(cssLikeLabelPrepared, /color-mix\(in srgb, red, blue\)/);
assert.ok(renderSvgToPng(cssLikeLabelSvg).subarray(0, 8).equals(pngSignature));

const literalBackgroundSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" style="background:#fff"></svg>';
assert.equal(prepareSvgForPng(literalBackgroundSvg).background, '#fff');
assertRenderedPixel(literalBackgroundSvg, [255, 255, 255, 255]);

const stylesheetOverrideSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" style="background:var(--bg)"><style>svg { --bg:#fff; } svg { --bg:#000; }</style></svg>';
assert.equal(prepareSvgForPng(stylesheetOverrideSvg).background, '#000');
assertRenderedPixel(stylesheetOverrideSvg, [0, 0, 0, 255]);

const inlineOverrideSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" style="--bg:#123;background:var(--bg)"><style>svg { --bg:#fff; }</style></svg>';
assert.equal(prepareSvgForPng(inlineOverrideSvg).background, '#123');
assertRenderedPixel(inlineOverrideSvg, [17, 34, 51, 255]);

const rootSpecificitySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" style="background:var(--bg)"><style>:root { --bg:#fff; } svg { --bg:#000; }</style></svg>';
assert.equal(prepareSvgForPng(rootSpecificitySvg).background, '#fff');

const scopedVariablesSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>.theme { --accent:#f00; } .node { fill:var(--accent); }</style><rect class="theme node"/></svg>';
assert.throws(
  () => prepareSvgForPng(scopedVariablesSvg),
  /custom properties only on the root svg element/,
);

const mixedCaseSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" style="--bg:#fff;background:VAR(--bg)"><style>rect { fill:COLOR-MIX(in srgb, #fff 50%, #000); }</style><rect width="5" height="5" fill="myvar(--bg)" filter="--var(--bg)"/></svg>';
const mixedCasePrepared = prepareSvgForPng(mixedCaseSvg);
assert.equal(mixedCasePrepared.background, '#fff');
assert.match(mixedCasePrepared.svg, /fill:#808080/);
assert.match(mixedCasePrepared.svg, /fill="myvar\(--bg\)"/);
assert.match(mixedCasePrepared.svg, /filter="--var\(--bg\)"/);

const partialMixSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" style="background:color-mix(in srgb, #f00 20%, #00f 20%)"></svg>';
assert.equal(prepareSvgForPng(partialMixSvg).background, 'rgba(128, 0, 128, 0.4)');
// Resvg exposes premultiplied RGBA pixels, so 128 at 40% alpha is stored as 51.
assertRenderedPixel(partialMixSvg, [51, 0, 51, 102]);
assert.throws(
  () => prepareSvgForPng('<svg xmlns="http://www.w3.org/2000/svg" style="background:color-mix(in srgb, #f00 120%, #00f)"></svg>'),
  /Invalid CSS color weight/,
);

function assertRenderedPixel(svg, expectedRgba) {
  const rendered = renderSvgForPng(svg, 100);
  assert.ok(rendered.asPng().subarray(0, 8).equals(pngSignature));
  assert.deepEqual([...rendered.pixels.subarray(0, 4)], expectedRgba);
}

const cliTestDir = mkdtempSync(join(tmpdir(), 'pretty-mermaid-smoke-'));
const flowchartPath = join(examplesDir, 'flowchart.mmd');
const xychartPath = join(examplesDir, 'xychart.mmd');
const customColorArgs = [
  '--bg', '#ffffff',
  '--fg', '#123456',
  '--line', '#abcdef',
  '--accent', '#fedcba',
  '--border', '#0f0f0f',
];
const customColorCodes = [
  '\u001b[38;2;18;52;86m',
  '\u001b[38;2;171;205;239m',
  '\u001b[38;2;254;220;186m',
  '\u001b[38;2;15;15;15m',
];

try {
  for (const themeName of inheritedThemeNames) {
    const renderResult = spawnSync(process.execPath, [
      join(scriptsDir, 'render.mjs'),
      '--input', flowchartPath,
      '--theme', themeName,
    ], { encoding: 'utf8' });
    assert.notEqual(renderResult.status, 0, `render.mjs accepted inherited theme: ${themeName}`);
    assert.match(renderResult.stderr, /Unknown theme:/);

    const batchResult = spawnSync(process.execPath, [
      join(scriptsDir, 'batch.mjs'),
      '--input-dir', examplesDir,
      '--output-dir', join(cliTestDir, themeName),
      '--theme', themeName,
    ], { encoding: 'utf8' });
    assert.notEqual(batchResult.status, 0, `batch.mjs accepted inherited theme: ${themeName}`);
    assert.match(batchResult.stderr, /Unknown theme:/);
  }

  const interactiveSvgPath = join(cliTestDir, 'interactive.svg');
  const renderInteractiveResult = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', xychartPath,
    '--output', interactiveSvgPath,
    '--interactive',
  ], { encoding: 'utf8' });
  assert.equal(renderInteractiveResult.status, 0, renderInteractiveResult.stderr);
  assert.match(readFileSync(interactiveSvgPath, 'utf8'), /class="xychart-tip/);

  const batchInteractiveDir = join(cliTestDir, 'batch-interactive');
  const batchInteractiveResult = spawnSync(process.execPath, [
    join(scriptsDir, 'batch.mjs'),
    '--input-dir', examplesDir,
    '--output-dir', batchInteractiveDir,
    '--interactive',
  ], { encoding: 'utf8' });
  assert.equal(batchInteractiveResult.status, 0, batchInteractiveResult.stderr);
  assert.match(batchInteractiveResult.stdout, /xychart\.mmd/);
  assert.match(readFileSync(join(batchInteractiveDir, 'xychart.svg'), 'utf8'), /class="xychart-tip/);

  const pngPath = join(cliTestDir, 'flowchart.png');
  const renderPngResult = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', flowchartPath,
    '--output', pngPath,
    '--format', 'png',
    '--theme', 'tokyo-night',
    '--width', '640',
  ], { encoding: 'utf8' });
  assert.equal(renderPngResult.status, 0, renderPngResult.stderr);
  const png = readFileSync(pngPath);
  assert.ok(png.subarray(0, 8).equals(pngSignature));
  assert.equal(png.readUInt32BE(16), 640);

  const batchPngDir = join(cliTestDir, 'batch-png');
  const batchPngResult = spawnSync(process.execPath, [
    join(scriptsDir, 'batch.mjs'),
    '--input-dir', examplesDir,
    '--output-dir', batchPngDir,
    '--format', 'png',
    '--theme', 'github-light',
    '--width', '480',
  ], { encoding: 'utf8' });
  assert.equal(batchPngResult.status, 0, batchPngResult.stderr);
  const batchPngFiles = readdirSync(batchPngDir).filter(file => file.endsWith('.png'));
  assert.equal(batchPngFiles.length, files.length);
  assert.equal(readFileSync(join(batchPngDir, 'xychart.png')).readUInt32BE(16), 480);

  const themedAsciiPath = join(cliTestDir, 'dracula.txt');
  const renderThemedAsciiResult = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', flowchartPath,
    '--output', themedAsciiPath,
    '--format', 'ascii',
    '--color-mode', 'truecolor',
    '--theme', 'dracula',
  ], { encoding: 'utf8' });
  assert.equal(renderThemedAsciiResult.status, 0, renderThemedAsciiResult.stderr);
  assert.match(readFileSync(themedAsciiPath, 'utf8'), /\u001b\[38;2;248;248;242m/);

  const batchThemedAsciiDir = join(cliTestDir, 'batch-dracula');
  const batchThemedAsciiResult = spawnSync(process.execPath, [
    join(scriptsDir, 'batch.mjs'),
    '--input-dir', examplesDir,
    '--output-dir', batchThemedAsciiDir,
    '--format', 'ascii',
    '--color-mode', 'truecolor',
    '--theme', 'dracula',
  ], { encoding: 'utf8' });
  assert.equal(batchThemedAsciiResult.status, 0, batchThemedAsciiResult.stderr);
  assert.match(
    readFileSync(join(batchThemedAsciiDir, 'flowchart.txt'), 'utf8'),
    /\u001b\[38;2;248;248;242m/,
  );

  const customAsciiPath = join(cliTestDir, 'custom.txt');
  const renderCustomAsciiResult = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', flowchartPath,
    '--output', customAsciiPath,
    '--format', 'ascii',
    '--color-mode', 'truecolor',
    ...customColorArgs,
  ], { encoding: 'utf8' });
  assert.equal(renderCustomAsciiResult.status, 0, renderCustomAsciiResult.stderr);
  const customAscii = readFileSync(customAsciiPath, 'utf8');
  for (const colorCode of customColorCodes) {
    assert.ok(customAscii.includes(colorCode), `render.mjs omitted custom ASCII color ${colorCode}`);
  }

  const batchCustomAsciiDir = join(cliTestDir, 'batch-custom');
  const batchCustomAsciiResult = spawnSync(process.execPath, [
    join(scriptsDir, 'batch.mjs'),
    '--input-dir', examplesDir,
    '--output-dir', batchCustomAsciiDir,
    '--format', 'ascii',
    '--color-mode', 'truecolor',
    ...customColorArgs,
  ], { encoding: 'utf8' });
  assert.equal(batchCustomAsciiResult.status, 0, batchCustomAsciiResult.stderr);
  const batchCustomAscii = readFileSync(join(batchCustomAsciiDir, 'flowchart.txt'), 'utf8');
  for (const colorCode of customColorCodes) {
    assert.ok(batchCustomAscii.includes(colorCode), `batch.mjs omitted custom ASCII color ${colorCode}`);
  }
  const guardPath = join(cliTestDir, 'overwrite-guard.svg');
  const guardFirstRender = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', flowchartPath,
    '--output', guardPath,
  ], { encoding: 'utf8' });
  assert.equal(guardFirstRender.status, 0, guardFirstRender.stderr);
  const guardContentBefore = readFileSync(guardPath, 'utf8');

  const guardRerunResult = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', flowchartPath,
    '--output', guardPath,
  ], { encoding: 'utf8' });
  assert.notEqual(guardRerunResult.status, 0, 'render.mjs overwrote an existing output without --force');
  assert.match(guardRerunResult.stderr, /already exists/);

  const guardSourceResult = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', flowchartPath,
    '--output', flowchartPath,
  ], { encoding: 'utf8' });
  assert.notEqual(guardSourceResult.status, 0, 'render.mjs overwrote the input file without --force');
  assert.match(guardSourceResult.stderr, /already exists/);

  const guardForceResult = spawnSync(process.execPath, [
    join(scriptsDir, 'render.mjs'),
    '--input', flowchartPath,
    '--output', guardPath,
    '--force',
    '--theme', 'tokyo-night',
  ], { encoding: 'utf8' });
  assert.equal(guardForceResult.status, 0, guardForceResult.stderr);
  assert.notStrictEqual(
    readFileSync(guardPath, 'utf8'),
    guardContentBefore,
    '--force exited successfully but did not replace the file content',
  );

  const batchGuardArgs = [
    join(scriptsDir, 'batch.mjs'),
    '--input-dir', examplesDir,
    '--output-dir', join(cliTestDir, 'batch-guard'),
  ];
  const batchGuardFirst = spawnSync(process.execPath, batchGuardArgs, { encoding: 'utf8' });
  assert.equal(batchGuardFirst.status, 0, batchGuardFirst.stderr);
  const batchGuardRerun = spawnSync(process.execPath, batchGuardArgs, { encoding: 'utf8' });
  assert.notEqual(batchGuardRerun.status, 0, 'batch.mjs overwrote existing outputs without --force');
  assert.match(batchGuardRerun.stderr, /already exists/);
  const batchGuardForce = spawnSync(process.execPath, [...batchGuardArgs, '--force'], { encoding: 'utf8' });
  assert.equal(batchGuardForce.status, 0, batchGuardForce.stderr);
} finally {
  rmSync(cliTestDir, { recursive: true, force: true });
}

console.log(`Smoke tests passed: ${files.length} diagrams x 3 formats, 15 themes, CLI named/custom colors, interactive coverage, overwrite guard (single + batch).`);
