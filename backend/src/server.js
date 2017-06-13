import http from 'http';
import fs from 'fs';

http.createServer((req, res) => {
  console.log(req.url);
  if (req.url === '/login.html') {
    res.end(fs.readFileSync('frontend/build/login.html'));
  }
  if (req.url === '/login.js') {
    res.end(fs.readFileSync('frontend/build/login.js'));
  }
  res.end('XD');
}).listen(8888);

console.log('XDDDDDD2242234dddddddddddddddd');
