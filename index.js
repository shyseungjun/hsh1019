const http = require('http');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 8080;
const TOONATION_TOKEN = process.env.TOONATION_TOKEN;

/**
 * 1️⃣ Fly / Render 생존용 HTTP 서버
 * (이 서버가 죽으면 배포 환경에서 프로세스가 바로 종료됨)
 */
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP 서버 리슨 중: 0.0.0.0:${PORT}`);
});

/**
 * 2️⃣ 토큰 없으면 종료 ❌ / 대기 모드
 */
if (!TOONATION_TOKEN) {
  console.log('⚠️ TOONATION_TOKEN 없음 (대기 모드)');
  process.stdin.resume(); // 프로세스 유지
  return;
}

(async () => {
  try {
    console.log('🧠 puppeteer 시작');

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const page = await browser.newPage();

    /**
     * 3️⃣ WebSocket 후킹 (🔥 핵심)
     * ⚠️ 반드시 goto 이전
     */
    await page.evaluateOnNewDocument(() => {
      const OriginalWebSocket = window.WebSocket;

      window.WebSocket = function (...args) {
        const ws = new OriginalWebSocket(...args);

        ws.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);

            // 콘솔로 그대로 출력 → Node에서 수신
            console.log('💥 WebSocket 수신:', JSON.stringify(data));
          } catch (e) {
            // JSON 아니면 무시
          }
        });

        return ws;
      };
    });

    /**
     * 4️⃣ 브라우저 콘솔 → Node 콘솔로 전달
     */
    page.on('console', (msg) => {
      console.log('🖥️ [브라우저]', msg.text());
    });

    const url = `https://toon.at/widget/alertbox/${TOONATION_TOKEN}`;

    console.log('🔗 Alertbox 접속 중...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log('✅ Alertbox 로드 완료');
    console.log('⏳ 후원 대기 중...');

  } catch (err) {
    console.error('❌ puppeteer 오류:', err);
  }
})();
