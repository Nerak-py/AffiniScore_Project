const fs = require('fs');
const path = require('path');
const https = require('https');

const soundsDir = path.join(__dirname, 'src', 'assets', 'sounds');

if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

const sounds = {
  'check.mp3': 'https://raw.githubusercontent.com/ion-sound/ion.sound/master/sounds/button_click.mp3',
  'reward.mp3': 'https://raw.githubusercontent.com/ion-sound/ion.sound/master/sounds/bell_ring.mp3'
};

function downloadFile(urlStr, filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(soundsDir, filename);
    const file = fs.createWriteStream(dest);
    
    https.get(urlStr, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, filename).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: Status Code ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename} successfully to ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function start() {
  for (const [filename, url] of Object.entries(sounds)) {
    try {
      await downloadFile(url, filename);
    } catch (e) {
      console.error(`Error downloading ${filename}:`, e.message);
    }
  }
}

start();
