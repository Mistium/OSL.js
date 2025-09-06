#!/usr/bin/env node

import { compiler } from '../modules/compiler.mjs';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERSION = '1.0.0';

function showHelp() {
  console.log(`
OSL (Origin Scripting Language) CLI v${VERSION}

Usage:
  osl <command> [options]

Commands:
  compile <file.osl>    Compile OSL file to JavaScript
  run <file.osl>        Compile and run OSL file
  origin                Open Origin website (https://origin.mistium.com)
  update                Update OSL.js from GitHub repository
  help                  Show this help message
  version               Show version information

Examples:
  osl compile script.osl       # Compiles script.osl to script.js
  osl run script.osl           # Compiles and runs script.osl
  osl origin                   # Opens Origin website
  osl update                   # Updates OSL.js from GitHub

For more information, visit: https://origin.mistium.com
`);
}

function showVersion() {
  console.log(`OSL CLI v${VERSION}`);
  console.log('Repository: https://github.com/Mistium/OSL.js');
  console.log('Website: https://origin.mistium.com');
}

function compileFile(filePath, outputPath = null) {
  try {
    const fullPath = resolve(filePath);
    const code = readFileSync(fullPath, 'utf8');
    
    console.log(`Compiling ${filePath}...`);
    
    // Create compiler instance and access the compiled string
    const compilerInstance = new compiler({
      output: 'string',
      code: code
    });
    
    const compiledCode = compilerInstance.out;
    
    if (!outputPath) {
      outputPath = filePath.replace(/\.osl$/, '.js');
    }
    
    writeFileSync(outputPath, compiledCode);
    console.log(`✅ Compiled successfully to ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Compilation failed: ${error.message}`);
    process.exit(1);
  }
}

function runFile(filePath) {
  try {
    const fullPath = resolve(filePath);
    const code = readFileSync(fullPath, 'utf8');
    
    console.log(`Running ${filePath}...`);
    console.log('─'.repeat(50));
    
    // The compiler constructor returns the compiled function directly
    const compiledFunction = new compiler({
      output: 'function',
      code: code
    });
    
    compiledFunction();
    
  } catch (error) {
    console.error(`❌ Execution failed: ${error.message}`);
    process.exit(1);
  }
}

function openOrigin() {
  const url = 'https://origin.mistium.com';
  console.log(`Opening Origin website: ${url}`);
  
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      execSync(`open "${url}"`);
    } else if (platform === 'win32') {
      execSync(`start "${url}"`);
    } else {
      execSync(`xdg-open "${url}"`);
    }
    console.log('✅ Origin website opened in your default browser');
  } catch (error) {
    console.error(`❌ Failed to open browser: ${error.message}`);
    console.log(`Please manually visit: ${url}`);
  }
}

function updateOSL() {
  console.log('Updating OSL.js from GitHub...');
  
  try {
    const projectRoot = resolve(__dirname, '..');
    
    // Check if we're in a git repository
    try {
      execSync('git status', { cwd: projectRoot, stdio: 'ignore' });
    } catch {
      console.error('❌ Not in a git repository. Please clone from https://github.com/Mistium/OSL.js');
      process.exit(1);
    }
    
    console.log('Fetching latest changes...');
    execSync('git fetch origin', { cwd: projectRoot, stdio: 'inherit' });
    
    console.log('Pulling updates...');
    execSync('git pull origin main', { cwd: projectRoot, stdio: 'inherit' });
    
    console.log('✅ OSL.js updated successfully!');
    
  } catch (error) {
    console.error(`❌ Update failed: ${error.message}`);
    console.log('Please manually update by running:');
    console.log('  git pull origin main');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const command = args[0];
const file = args[1];

switch (command) {
  case 'compile':
  case 'c':
    if (!file) {
      console.error('❌ Please specify a file to compile');
      console.log('Usage: osl compile <file.osl>');
      process.exit(1);
    }
    compileFile(file, args[2]);
    break;
    
  case 'run':
  case 'r':
    if (!file) {
      console.error('❌ Please specify a file to run');
      console.log('Usage: osl run <file.osl>');
      process.exit(1);
    }
    runFile(file);
    break;
    
  case 'origin':
  case 'o':
    openOrigin();
    break;
    
  case 'update':
  case 'u':
    updateOSL();
    break;
    
  case 'version':
  case 'v':
  case '--version':
    showVersion();
    break;
    
  case 'help':
  case 'h':
  case '--help':
  default:
    showHelp();
    break;
}
