const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'node_modules', '.prisma');
const dest = path.join(__dirname, '..', '.next', 'server', '.prisma');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('📦 Copying Prisma Client to .next/server...');
try {
  copyRecursiveSync(source, dest);
  console.log('✅ Prisma Client copied successfully!');
} catch (error) {
  console.error('❌ Error copying Prisma Client:', error.message);
  process.exit(1);
}