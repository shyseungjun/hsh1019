import WebSocket from 'ws';
import fetch from 'node-fetch';
import http from 'http';

const PORT = process.env.PORT || 3000;
const TOONATION_TOKEN = process.env.TOONATION_TOKEN;

// ⚠️ 네 Apps Script WebApp URL 넣기
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw18Sdii1PodPwDKggL0nqF64qW0WEkLwAm-dghkR0Q4fJKLoPmQbcIIM6BtpfVmZbIXQ/exec';

if (!TOONATION_TOKEN) {
  console.error('❌ TOONATION_TOKEN 없음');
  process.exit(1);
}

console.log('서버 시작됨');

// Render용 HTTP 서버 (필수)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Donation WebSocket Server Running');
}).listen(PORT);

// 투네이션 WebSocket 연결
function connectToonation() {
  const wsUrl = `wss://socket.toon.at/alert?token=${TOONATION_TOKEN}`;
  console.log('🔌 투네이션 WebSocket 연결 시도');

  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('✅ 투네이션 WebSocket 연결 성공');
  });

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      // 후원 이벤트만 처리
      if (data.type !== 'donation') return;

      const nickname = data.nickname;
      const amount = Number(data.amount);

      if (!nickname || !amount) return;

      console.log(`💰 후원: ${nickname} / ${amount}`);

      // Apps Script로 전송
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, amount })
      });

    } catch (err) {
      console.error('메시지 처리 오류:', err);
    }
  });

  ws.on('close', () => {
    console.warn('⚠️ WebSocket 끊김, 5초 후 재연결');
    setTimeout(connectToonation, 5000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket 에러:', err);
    ws.close();
  });
}

connectToonation();
