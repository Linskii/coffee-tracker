#!/usr/bin/env node
'use strict';

/**
 * Deployment script for GitHub Pages
 * This script creates a clean gh-pages branch and deploys the static site
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, silent = false) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return result;
  } catch (error) {
    log(`Error executing: ${command}`, 'red');
    throw error;
  }
}

function deploy() {
  log('🚀 Starting deployment to GitHub Pages...', 'cyan');

  // Check if we have uncommitted changes
  const status = exec('git status --porcelain', true);
  if (status.trim()) {
    log('⚠️  Warning: You have uncommitted changes', 'yellow');
    log('Uncommitted changes will not be included in the deployment', 'yellow');
  }

  // Get current branch
  const currentBranch = exec('git rev-parse --abbrev-ref HEAD', true).trim();
  log(`Current branch: ${currentBranch}`, 'cyan');

  // Create a temporary directory for the build
  const tempDir = path.join(__dirname, '..', '.deploy-temp');

  log('📦 Preparing deployment files...', 'cyan');

  // Remove temp directory if it exists
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // Create temp directory
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy all necessary files to temp directory
  const filesToCopy = [
    'index.html',
    'css',
    'js',
    'CNAME' // If you have a custom domain
  ];

  filesToCopy.forEach(file => {
    const sourcePath = path.join(__dirname, '..', file);
    const destPath = path.join(tempDir, file);

    if (fs.existsSync(sourcePath)) {
      if (fs.statSync(sourcePath).isDirectory()) {
        fs.cpSync(sourcePath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
      log(`  ✓ Copied ${file}`, 'green');
    }
  });

  // Switch to gh-pages branch (create if it doesn't exist)
  log('🌿 Switching to gh-pages branch...', 'cyan');

  try {
    // Check if gh-pages branch exists
    exec('git show-ref --verify --quiet refs/heads/gh-pages', true);
    exec('git checkout gh-pages');
  } catch {
    // Branch doesn't exist, create it as an orphan branch
    log('Creating new gh-pages branch...', 'yellow');
    exec('git checkout --orphan gh-pages');
  }

  // Remove all files in gh-pages branch
  log('🧹 Cleaning gh-pages branch...', 'cyan');
  const files = fs.readdirSync(process.cwd());
  files.forEach(file => {
    if (file !== '.git' && file !== '.deploy-temp') {
      const filePath = path.join(process.cwd(), file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });

  // Copy files from temp directory to root
  log('📋 Copying deployment files...', 'cyan');
  const tempFiles = fs.readdirSync(tempDir);
  tempFiles.forEach(file => {
    const sourcePath = path.join(tempDir, file);
    const destPath = path.join(process.cwd(), file);

    if (fs.statSync(sourcePath).isDirectory()) {
      fs.cpSync(sourcePath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });

  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });

  // Add all files and commit
  log('💾 Committing changes...', 'cyan');
  exec('git add -A');

  try {
    exec(`git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"`, true);
    log('  ✓ Changes committed', 'green');
  } catch {
    log('  ℹ️  No changes to commit', 'yellow');
  }

  // Push to GitHub
  log('☁️  Pushing to GitHub...', 'cyan');
  exec('git push origin gh-pages');

  // Switch back to original branch
  log(`🔙 Switching back to ${currentBranch}...`, 'cyan');
  exec(`git checkout ${currentBranch}`);

  log('✅ Deployment complete!', 'green');
  log(`🌐 Your site will be available at: https://linskii.github.io/coffee-tracker/`, 'cyan');
}

// Run deployment
try {
  deploy();
} catch (error) {
  log('❌ Deployment failed!', 'red');
  console.error(error);
  process.exit(1);
}
