import http from 'http';
import fs from 'fs';
import facebookChatApi from 'facebook-chat-api';
import * as websocket from 'websocket';

const userLogged = false;

let wsClientsCount = 0;
const wsClients = {};

const serverName = 'localhost:8888';

const staticList = {
    '/index.html': 'frontend/build/index.html',
    '/index.js': 'frontend/build/index.js',
};

const httpServer = http.createServer((req, res) => {
    if (staticList[req.url] !== undefined) {
        res.end(fs.readFileSync(staticList[req.url]));
    } else if (req.url === '/favicon.ico') {
        res.end(0);
    } else {
        res.end(fs.readFileSync('frontend/build/index.html'));
    }
}).listen(8888);

new websocket.server({
    httpServer,
}).on('request', (r) => {
    const connection = r.accept('echo-protocol', r.origin);
    const id = wsClientsCount++;

    wsClients[id] = connection;

    connection.on('message', (message) => {
        console.log(`Recived message: ${message.utf8Data}`);
        const data = message.utf8Data;
        let parsedData;

        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            console.log(`Error while parsing data from websocket: ${e}`);
            return;
        }

        if (parsedData.type === undefined) {
            console.log('Error while parsing data from websocket: message has no type');
            return;
        }


        // wsClients.forEach((client) => { client.sendUTF(wyn); });
    });

    connection.on('close', (reasonCode, description) => {
        delete wsClients[id];
        console.log(`${new Date()} Peer ${connection.remoteAddress} disconnected.`);
        console.log(description, reasonCode);
    });

    console.log(`${new Date()} Connection accepted [${id}]`);
});

console.log('XDDDDDD2242234dddddddddddddddd');
