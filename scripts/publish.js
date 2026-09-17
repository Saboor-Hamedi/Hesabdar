#!/usr/bin/env node

/**
 * scripts/publish.js
 *
 * Automates the complete release publishing:
 * 1. Checks git status and commits any staged/modified files.
 * 2. If 'patch', 'minor', or 'major' argument is given, bumps version in package.json.
 * 3. Creates the git tag (e.g. v1.0.1) automatically.
 * 4. Pushes commits and tags to GitHub.
 * 5. This triggers the GitHub Actions workflow to build Windows, macOS, and Linux releases.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit' });
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const arg = process.argv[2] || 'patch';

try {
  console.log('🔍 Checking git status...');
  const status = runSilent('git status --porcelain');
  if (status) {
    console.log('📝 Staging and committing modified files...');
    run('git add -A');
    const commitMsg = arg ? `chore(release): prepare ${arg} release` : `chore: prepare release`;
    run(`git commit -m "${commitMsg}"`);
  }

  let version;
  if (['patch', 'minor', 'major'].includes(arg)) {
    console.log(`🆙 Bumping version (${arg})...`);
    run(`npm version ${arg} --no-git-tag-version`);
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    version = `v${pkg.version}`;
    run('git add package.json package-lock.json');
    run(`git commit -m "chore(release): ${version}"`);
  } else {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    version = `v${pkg.version}`;
  }

  // Create tag if it doesn't already exist
  const existingTag = runSilent(`git tag -l ${version}`);
  if (!existingTag) {
    console.log(`🏷️  Creating git tag ${version}...`);
    run(`git tag -a ${version} -m "Release ${version}"`);
  } else {
    console.log(`ℹ️  Tag ${version} already exists locally.`);
  }

  // Push commits to current branch
  console.log('📤 Pushing commits to GitHub...');
  run('git push');

  // Push tag to GitHub
  console.log(`📤 Pushing tag ${version} to GitHub...`);
  run(`git push origin ${version}`);

  console.log('\n======================================================');
  console.log(`🎉 Successfully published ${version} to GitHub!`);
  console.log('⚡ GitHub Actions has started building:');
  console.log('   - Windows (.exe setup)');
  console.log('   - macOS (.dmg / .zip)');
  console.log('   - Linux (.AppImage / .deb)');
  console.log('======================================================\n');
} catch (err) {
  console.error('\n❌ Release publish failed:', err.message);
  process.exit(1);
}
