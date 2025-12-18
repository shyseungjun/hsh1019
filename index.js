import http from 'http';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 3000;

// ⚠️ 네 Alertbox 토큰
const TOONATION_TOKEN = process.env.TOONATION_TOKEN;

// ⚠️ 네 Apps Script WebApp URL
const GOOGLE_SCRIPT_URL = '여기에_네_웹앱_URL';

if (!TOONATION_TOKEN) {
  console.error('❌ TOONATION_TOKEN 없음');
  process.exit(1);
}

// Render는 HTTP 서버가 떠 있어야 안정적
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Donation Headless Server Running');
}).listen(PORT);

console.log('서버 시작됨');

// Alertbox URL
const ALERTBOX_URL = `https://toon.at/widget/alertbox/${TOONATION_TOKEN}`;

// 후원 이벤트 처리
async function handleDonation(payload) {
  const nickname = payload?.name || payload?.nickname;
  const amount = Number(payload?.amount || payload?.value);

  if (!nickname || !amount) return;

  console.log(`💰 후원 수신: ${nickname} / ${amount}`);

  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, amount })
  });
}

// Headless 브라우저 실행
async function run() {
  console.log('🧠 Headless 브라우저 시작');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  // 페이지 콘솔 로그 감시 (Alertbox가 콘솔로 이벤트를 찍는 경우)
  page.on('console', async (msg) => {
    try {
      const text = msg.text();
      // 콘솔에 찍히는 JSON 중 donation 이벤트만 파싱
      if (text.includes('donation')) {
        const json = JSON.parse(text);
        if (json?.type === 'donation') {
          await handleDonation(json);
        }
      }
    } catch (e) {}
  });

  // 네트워크 응답 감시 (XHR/WS 프레임에서 JSON 떨어지는 경우)
  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (!url.includes('toon')) return;

      const ct = response.headers()['content-type'] || '';
      if (!ct.includes('application/json')) return;

      const data = await response.json();
      if (data?.type === 'donation') {
        await handleDonation(data);
      }
    } catch (e) {}
  });

  console.log('🔗 Alertbox 접속:', ALERTBOX_URL);
  await page.goto(ALERTBOX_URL, { waitUntil: 'networkidle2' });

  console.log('✅ Alertbox 로드 완료, 대기 중...');
}

run().catch(err => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
