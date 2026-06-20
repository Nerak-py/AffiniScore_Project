const https = require('https');
const urlParser = require('url');

const urls = [
  'https://upload.wikimedia.org/wikipedia/commons/9/9f/Click.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/b/b5/Click_sound.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/c/c4/2_success_chimes.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/4/47/Coin_drop.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/5/5e/Bell_chime.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/2/2c/3_success_chimes.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/1/14/Common_chime.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/e/ec/SuccessCall.mp3'
];

function checkUrl(urlStr) {
  return new Promise((resolve) => {
    const parsedUrl = urlParser.parse(urlStr);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(options, (res) => {
      resolve({ url: urlStr, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ url: urlStr, statusCode: 500, error: err.message });
    });
  });
}

async function testAll() {
  console.log('Checking URLs with User-Agent...');
  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(`${result.statusCode === 200 ? '✅' : '❌'} [${result.statusCode}] ${result.url}`);
  }
}

testAll();
