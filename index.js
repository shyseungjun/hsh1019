import http from 'http';
import puppeteer from 'puppeteer';

const PORT = process.env.PORT || 3000;
const TOONATION_TOKEN = process.env.TOONATION_TOKEN;

if (!TOONATION_TOKEN) {
  console.error('❌ TOONATION_TOKEN 없음');
  process.exit(1);
}

// Render용 HTTP 서버 (필수)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP 서버 리슨 중: 0.0.0.0:${PORT}`);
});

const ALERTBOX_URL = `https://toon.at/widget/alertbox/${TOONATION_TOKEN}`;

async function run() {
  console.log('🧠 puppeteer 시작');

  const browser = await puppeteer.launch({
    headless: true,
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

  // 🔒 Render에서 프로세스 유지용 무한 대기
  await new Promise(() => {});
}

run().catch(err => {
  console.error('❌ puppeteer 오류:', err);
  process.exit(1);
});
