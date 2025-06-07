import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const backendPath = path.join(__dirname, '../hyvongcuoicung/new2');
const publicPath = path.join(__dirname, './public/hyvongcuoicung/new2');

// Ensure public directory exists
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
}

// Function to copy file
function copyFile(filename) {
  const sourcePath = path.join(backendPath, filename);
  const targetPath = path.join(publicPath, filename);
  
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied ${filename} to public directory`);
  } else {
    console.log(`⚠️  Source file ${filename} not found`);
  }
}

// Function to sync entire directory
function syncDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠️  Source directory ${sourceDir} not found`);
    return;
  }

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(sourceDir);
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Synced ${file} to public directory`);
    }
  });
}

// Watch for file changes
const filesToWatch = ['data.js', 'data_checkin.js'];

filesToWatch.forEach(filename => {
  const filePath = path.join(backendPath, filename);
  
  // Initial copy
  copyFile(filename);
  
  // Watch for changes
  if (fs.existsSync(filePath)) {
    fs.watchFile(filePath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log(`🔄 ${filename} changed, copying...`);
        setTimeout(() => copyFile(filename), 100); // Small delay to ensure file write is complete
      }
    });
    console.log(`👁️  Watching ${filename} for changes...`);
  }
});

// Sync CrawCheckin data directory
const crawlCheckinDataPath = path.join(backendPath, 'CrawCheckin/src/data');
const publicCrawlCheckinDataPath = path.join(publicPath, 'CrawCheckin/src/data');

// Initial sync
console.log('🔄 Initial sync of CrawCheckin data directory...');
syncDirectory(crawlCheckinDataPath, publicCrawlCheckinDataPath);

// Watch CrawCheckin data directory for changes
if (fs.existsSync(crawlCheckinDataPath)) {
  fs.watch(crawlCheckinDataPath, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
      console.log(`🔄 CrawCheckin data file ${filename} changed, syncing...`);
      setTimeout(() => {
        syncDirectory(crawlCheckinDataPath, publicCrawlCheckinDataPath);
      }, 100);
    }
  });
  console.log(`👁️  Watching CrawCheckin/src/data directory for changes...`);
}

console.log('🚀 File sync watcher started. Press Ctrl+C to stop.');

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n🛑 File sync watcher stopped.');
  process.exit(0);
}); 