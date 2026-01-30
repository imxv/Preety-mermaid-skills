#!/usr/bin/env node

/**
 * Node.js helper for beautiful-mermaid rendering
 * Called by Python wrapper scripts
 */

import { renderMermaid, renderMermaidAscii, THEMES } from 'beautiful-mermaid';
import { readFileSync, writeFileSync } from 'fs';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'render':
        await handleRender();
        break;
      case 'list-themes':
        handleListThemes();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

async function handleRender() {
  const options = parseRenderArgs();
  const input = readFileSync(options.input, 'utf8');

  if (options.format === 'ascii') {
    const ascii = renderMermaidAscii(input, {
      useAscii: options.useAscii,
      paddingX: options.paddingX,
      paddingY: options.paddingY,
      boxBorderPadding: options.boxBorderPadding,
    });

    if (options.output) {
      writeFileSync(options.output, ascii);
      console.log(`ASCII diagram saved to ${options.output}`);
    } else {
      console.log(ascii);
    }
  } else {
    // SVG rendering
    const theme = options.theme ? THEMES[options.theme] : undefined;
    const colors = theme || {
      bg: options.bg,
      fg: options.fg,
      ...(options.line && { line: options.line }),
      ...(options.accent && { accent: options.accent }),
      ...(options.muted && { muted: options.muted }),
      ...(options.surface && { surface: options.surface }),
      ...(options.border && { border: options.border }),
    };

    const svg = await renderMermaid(input, {
      ...colors,
      font: options.font,
      transparent: options.transparent,
    });

    if (options.output) {
      writeFileSync(options.output, svg);
      console.log(`SVG diagram saved to ${options.output}`);
    } else {
      console.log(svg);
    }
  }
}

function handleListThemes() {
  console.log(JSON.stringify(Object.keys(THEMES), null, 2));
}

function parseRenderArgs() {
  const options = {
    input: null,
    output: null,
    format: 'svg',
    theme: null,
    bg: '#FFFFFF',
    fg: '#27272A',
    font: 'Inter',
    transparent: false,
    useAscii: false,
    paddingX: 5,
    paddingY: 5,
    boxBorderPadding: 1,
  };

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--input':
        options.input = value;
        break;
      case '--output':
        options.output = value;
        break;
      case '--format':
        options.format = value;
        break;
      case '--theme':
        options.theme = value;
        break;
      case '--bg':
        options.bg = value;
        break;
      case '--fg':
        options.fg = value;
        break;
      case '--line':
        options.line = value;
        break;
      case '--accent':
        options.accent = value;
        break;
      case '--muted':
        options.muted = value;
        break;
      case '--surface':
        options.surface = value;
        break;
      case '--border':
        options.border = value;
        break;
      case '--font':
        options.font = value;
        break;
      case '--transparent':
        options.transparent = value === 'true';
        break;
      case '--use-ascii':
        options.useAscii = value === 'true';
        break;
      case '--padding-x':
        options.paddingX = parseInt(value);
        break;
      case '--padding-y':
        options.paddingY = parseInt(value);
        break;
      case '--box-border-padding':
        options.boxBorderPadding = parseInt(value);
        break;
    }
  }

  if (!options.input) {
    throw new Error('--input is required');
  }

  return options;
}

main();
