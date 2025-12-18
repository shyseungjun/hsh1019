import http from 'http';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 3000;
const TOONATION_TOKEN = process.env.TOONATION_TOKEN;
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw18Sdii1PodPwDKggL0nqF64qW0WEkLwAm-dghkR0Q4fJKLoPmQbcIIM6BtpfVmZbIXQ/exec';

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(PORT, () => {
  console.log('✅ HTTP 서버 리슨 중:', PORT);
});

if (!TOONATION_TOKEN) {
  console.error('❌ TOONATION_TOKEN 없음');
  process.exit(1);
}

const ALERTBOX_URL = `https://toon.at/widget/alertbox/${TOONATION_TOKEN}`;

async function run() {
  console.log('🧠 puppeteer 시작');

  const browser = await puppeteer.launch({
    headless: true, // ← new ❌
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  console.log('🔗 Alertbox 접속 시도');
  await page.goto(ALERTBOX_URL, { waitUntil: 'domcontentloaded' });

  console.log('✅ Alertbox 로드 완료');

  // ⚠️ 일단 이벤트 파싱은 잠시 꺼둠 (서버 안정화 먼저)
}

run().catch(err => {
  console.error('❌ puppeteer 오류:', err);
  process.exit(1);
});
