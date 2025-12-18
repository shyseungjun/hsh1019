const http = require('http');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 8080;
const TOONATION_TOKEN = process.env.TOONATION_TOKEN;

/**
 * 1️⃣ Fly 생존용 HTTP 서버 (절대 종료되면 안 됨)
 */
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP 서버 리슨 중: 0.0.0.0:${PORT}`);
});

/**
 * 2️⃣ 토큰 없으면 그냥 대기 (종료 ❌)
 */
if (!TOONATION_TOKEN) {
  console.log('⚠️ TOONATION_TOKEN 없음 (대기 모드)');
  process.stdin.resume(); // 프로세스 유지
  return;
}

/**
 * 3️⃣ 토큰 있을 때만 puppeteer 실행
 */
(async () => {
  try {
    console.log('🧠 puppeteer 시작');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const url = `https://toon.at/widget/alertbox/${TOONATION_TOKEN}`;

    console.log('🔗 Alertbox 접속:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log('✅ Alertbox 로드 완료');
  } catch (err) {
    console.error('❌ puppeteer 오류:', err);
  }
})();

console.log('🔗 Alertbox 접속 중...');
await page.goto(url, { waitUntil: 'domcontentloaded' });

console.log('✅ Alertbox 로드 완료');

/* 🔽 여기부터 DOM 감지 코드 */
await page.evaluate(() => {
  console.log('👀 DOM 감시 시작');

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        const text = node.innerText || '';

        if (text.includes('원') && (text.includes('후원') || text.includes('기부'))) {
          console.log('💰 후원 DOM 감지!');
          console.log('📄 텍스트:', text);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
