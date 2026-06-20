const fs = require('fs');
const path = require('path');
const https = require('https');
const urlParser = require('url');

const soundsDir = path.join(__dirname, 'src', 'assets', 'sounds');

if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

const sounds = {
  'check.mp3': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Click_sound.mp3',
  'reward.mp3': 'https://upload.wikimedia.org/wikipedia/commons/c/c4/2_success_chimes.mp3'
};

function downloadFile(urlStr, filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(soundsDir, filename);
    const file = fs.createWriteStream(dest);
    const parsedUrl = urlParser.parse(urlStr);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(options, (response) => {
      // Handle redirect
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
      fs.unlink(dest, () => {}); // Delete the file on error
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
