const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ffmpegBin = 'ffmpeg';

const dirs = [
  path.join(__dirname, '../public/music'),
  path.join(__dirname, '../public/uploads')
];

let totalOldSize = 0;
let totalNewSize = 0;

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.mp3'));

  for (const file of files) {
    const inputPath = path.join(dir, file);
    const tempPath = path.join(dir, `_temp_${file}`);
    const stat = fs.statSync(inputPath);
    const origSize = stat.size;
    totalOldSize += origSize;

    try {
      console.log(`Compressing ${file} (${(origSize / 1024 / 1024).toFixed(2)} MB)...`);
      execSync(`"${ffmpegBin}" -y -i "${inputPath}" -codec:a libmp3lame -b:a 128k -map_metadata 0 "${tempPath}"`, {
        stdio: 'ignore'
      });

      if (fs.existsSync(tempPath)) {
        const newStat = fs.statSync(tempPath);
        if (newStat.size < origSize) {
          fs.unlinkSync(inputPath);
          fs.renameSync(tempPath, inputPath);
          totalNewSize += newStat.size;
          console.log(`  -> Reduced to ${(newStat.size / 1024 / 1024).toFixed(2)} MB (-${((1 - newStat.size / origSize) * 100).toFixed(1)}%)`);
        } else {
          fs.unlinkSync(tempPath);
          totalNewSize += origSize;
          console.log(`  -> Kept original (already optimal: ${(origSize / 1024 / 1024).toFixed(2)} MB)`);
        }
      } else {
        totalNewSize += origSize;
      }
    } catch (err) {
      console.error(`  Error compressing ${file}:`, err.message);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }
      totalNewSize += origSize;
    }
  }
});

console.log('--------------------------------------------------');
console.log(`Total Before: ${(totalOldSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total After:  ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total Saved:  ${((totalOldSize - totalNewSize) / 1024 / 1024).toFixed(2)} MB (-${((1 - totalNewSize / totalOldSize) * 100).toFixed(1)}%)`);
