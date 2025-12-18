import http from 'http';
import puppeteer from 'puppeteer';

const PORT = process.env.PORT || 8080;
const TOONATION_TOKEN = process.env.TOONATION_TOKEN;

/**
 * 1️⃣ Fly smoke check용 HTTP 서버
 *    → 이게 떠 있어야 Fly가 "살아있다"고 판단함
 */
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP 서버 리슨 중: 0.0.0.0:${PORT}`);
});

/**
 * 2️⃣ 토큰 없을 때도 절대 종료하지 않음
 */
if (!TOONATION_TOKEN) {
  console.log('⚠️ TOONATION_TOKEN 없음 (대기 모드)');
  process.stdin.resume(); // 프로세스 유지
} else {
  /**
   * 3️⃣ 토큰 있을 때만 puppeteer 실행
   */
  (async () => {
    try {
      console.log('🧠 puppeteer 시작');

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      const url = `https://toon.at/widget/alertbox/${TOONATION_TOKEN}`;

      console.log('🔗 Alertbox 접속:', url);
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      console.log('✅ Alertbox 로드 완료');
    } catch (err) {
      console.error('❌ puppeteer 에러:', err);
    }
  })();
}
