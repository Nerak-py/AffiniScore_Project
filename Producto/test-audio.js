const https = require('https');

const urls = [
  'https://upload.wikimedia.org/wikipedia/commons/9/9f/Click.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/b/b5/Click_sound.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/c/c4/2_success_chimes.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/4/47/Coin_drop.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/5/5e/Bell_chime.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/2/2c/3_success_chimes.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/1/14/Common_chime.mp3',
  'https://upload.wikimedia.org/wikipedia/commons/e/ec/SuccessCall.mp3',
  'https://raw.githubusercontent.com/wle8300/beep-audio/master/click.mp3',
  'https://raw.githubusercontent.com/wle8300/beep-audio/master/success.mp3'
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, statusCode: 500, error: err.message });
    });
  });
}

async function testAll() {
  console.log('Checking URLs...');
  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(`${result.statusCode === 200 ? '✅' : '❌'} [${result.statusCode}] ${result.url}`);
  }
}

testAll();
