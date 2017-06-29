import http from 'http';
import fs from 'fs';
import facebookChatApi from 'facebook-chat-api';
import * as websocket from 'websocket';

let userLogged = false;
let fbApi = null;

const savedSessionFile = 'facebookSession.json';

console.log('Trying to restore session');
if (fs.existsSync(savedSessionFile)) {
    fbApi = facebookChatApi({ appState: JSON.parse(fs.readFileSync(savedSessionFile, 'utf8')) }, (err, api) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log('Restored session correctly');
        fbApi = api;
        userLogged = true;
    });
} else {
    console.log('Session file not found');
}

let wsClientsCount = 0;
const wsClients = {};

const staticList = {
    '/index.html': 'frontend/build/index.html',
    '/index.js': 'frontend/build/index.js',
    '/style.css': 'frontend/build/style.css',
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

    connection.sendUTF(JSON.stringify({ type: 'hello', userLogged }));

    connection.on('message', (message) => {
        console.log(`Received message: ${message.utf8Data}`);
        const data = message.utf8Data;
        let parsedData;

        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            console.log(`Error while parsing data from websocket: ${e}`);
            return;
        }

        switch (parsedData.type) {

            case 'login': {
                const credentials = {
                    email: parsedData.email,
                    password: parsedData.password,
                };
                fbApi = facebookChatApi(credentials, (err, api) => {
                    if (err) {
                        console.error(err);
                        connection.sendUTF(JSON.stringify({ type: 'error', error: err.error }));
                        return;
                    }

                    console.log('Logged in correctly');
                    connection.sendUTF(JSON.stringify({ type: 'info', info: 'Logged in' }));
                    fs.writeFileSync(savedSessionFile, JSON.stringify(api.getAppState()));
                    fbApi = api;
                    userLogged = true;
                });
                break;
            }

            case 'sendMessage': {
                fbApi.sendMessage('test', 100000000000000);
                break;
            }

            case undefined:
                console.log('Error while parsing data from websocket: message has no type');
                return;

            default:
                console.log(`Error while parsing data from websocket: message has unknown type (${parsedData.type})`);


        }

    });

    connection.on('close', (reasonCode, description) => {
        delete wsClients[id];
        console.log(`${new Date()} Peer ${connection.remoteAddress} disconnected.`);
        console.log(description, reasonCode);
    });

    console.log(`${new Date()} Connection accepted [${id}]`);
});

console.log('Server started');
