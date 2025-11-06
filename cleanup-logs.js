/**
 * Script to clean up excessive console.log statements
 * Keeps: console.error, console.warn
 * Removes: console.log, console.info, console.debug
 * 
 * Run with: node cleanup-logs.js
 */

const fs = require('fs');
const path = require('path');

// Directories to process
const DIRS_TO_PROCESS = [
  'services',
  'app',
  'components',
];

// Patterns to remove (but keep error/warn)
const PATTERNS_TO_REMOVE = [
  /^\s*console\.log\([^;]*\);?\s*$/gm,
  /^\s*console\.info\([^;]*\);?\s*$/gm,
  /^\s*console\.debug\([^;]*\);?\s*$/gm,
];

// Files to skip
const SKIP_FILES = [
  'ValidationHelpers.js', // Keep warnings for validation
];

let filesProcessed = 0;
let linesRemoved = 0;

function shouldSkipFile(filePath) {
  const fileName = path.basename(filePath);
  return SKIP_FILES.includes(fileName);
}

function cleanFile(filePath) {
  if (shouldSkipFile(filePath)) {
    console.log(`⏭️  Skipping: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLines = content.split('\n').length;
    
    // Remove console.log, console.info, console.debug
    PATTERNS_TO_REMOVE.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Remove empty lines created by removal (max 2 consecutive blank lines)
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    const newLines = content.split('\n').length;
    const removed = originalLines - newLines;
    
    if (removed > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned: ${filePath} (removed ${removed} lines)`);
      linesRemoved += removed;
      filesProcessed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️  Directory not found: ${dirPath}`);
    return;
  }
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.jsx'))) {
      cleanFile(fullPath);
    }
  }
}

console.log('🧹 Starting log cleanup...\n');
console.log('Will remove: console.log(), console.info(), console.debug()');
console.log('Will keep: console.error(), console.warn()\n');

DIRS_TO_PROCESS.forEach(dir => {
  console.log(`\n📁 Processing directory: ${dir}`);
  processDirectory(dir);
});

console.log('\n' + '='.repeat(50));
console.log(`✅ Cleanup complete!`);
console.log(`📊 Files processed: ${filesProcessed}`);
console.log(`📉 Lines removed: ${linesRemoved}`);
console.log('='.repeat(50));
