import WebSocket from 'ws';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 3000;

console.log('서버 시작됨, 포트:', PORT);

// Render는 HTTP 서버가 하나 떠 있어야 안정적
import http from 'http';
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Donation WebSocket Server Running');
}).listen(PORT);
