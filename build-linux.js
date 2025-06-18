const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building TypeScript...');
execSync('npx tsc', { stdio: 'inherit' });

console.log('Copying views...');
if (!fs.existsSync('dist/views')) {
  fs.mkdirSync('dist/views', { recursive: true });
}
execSync('cp -r src/views/* dist/views/', { stdio: 'inherit' });

console.log('Copying public files...');
if (!fs.existsSync('dist/public')) {
  fs.mkdirSync('dist/public', { recursive: true });
}
execSync('cp -r src/public/* dist/public/', { stdio: 'inherit' });

console.log('Build completed successfully!');