#!/usr/bin/env node

import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillRoot = join(__dirname, '..');

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

async function main() {
  const { THEMES } = await loadBeautifulMermaid();
  const themes = Object.keys(THEMES);

  console.log('Available Beautiful-Mermaid Themes:\n');
  themes.forEach((theme, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${theme}`);
  });

  console.log(`\nTotal: ${themes.length} themes`);
  console.log('\nUsage:');
  console.log('  node scripts/render.mjs --input diagram.mmd --theme <theme-name> --output output.svg');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
