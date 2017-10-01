import http from 'http';
import fs from 'fs';
import facebookChatApi from 'facebook-chat-api';
import * as websocket from 'websocket';

import fbListener from './fb_listener';

const MAX_MESSAGES_PER_THREAD = 100;

let userLogged = false;
let fbApi = null;
let yourFbId = null;
let friendList = [];

let wsClientsCount = 0;
const wsClients = [];

const threads = [];

const savedSessionFile = 'facebookSession.json';
const friendListFile = 'facebookFriendList.json';

function addNewMessage(message) {
    if (!(message.threadID in threads)) {
        threads[message.threadID] = {
            isGroup: message.isGroup,
            unreadCount: 0,
            messages: [],
            lastMessageTime: 0,
        };
    }

    /**
     * isUnread - is unread by you
     * readers - array of people who already read message, {reader: id, time: readTime}
     */

    const msg = {
        attachments: message.attachments,
        body: message.body,
        mentions: message.mentions,
        messageID: message.messageID,
        senderID: message.senderID,
        isUnread: message.isUnread,
        timestamp: message.time,
        readers: [],
    };

    if (msg.isUnread && msg.senderID === yourFbId) threads[msg.threadID].unreadCount++;

    threads[msg.threadID].lastMessageTime = msg.timestamp;
    threads[msg.threadID].messages.push(msg);

    if (threads[msg.threadID].messages.length > MAX_MESSAGES_PER_THREAD) {
        threads[msg.threadID].messages.shift();
    }
}

/* eslint no-param-reassign: ["error", { "props": false }] */

function readMessage(youRead, event) {
    if (!(event.threadID in threads)) return;

    const thread = threads[event.threadID];

    if (youRead) {
        thread.unreadCount = 0;
        thread.messages.forEach((msg) => {
            if (msg.isUnread && msg.senderID !== yourFbId) {
                msg.isUnread = false;
                msg.readers.push({ reader: yourFbId, time: event.time });
            }
        });
    } else {
        thread.messages.forEach((msg) => {
            if (msg.senderID !== yourFbId && !(event.reader in msg.readers)) {
                msg.isUnread = false;
                msg.readers.push({ reader: event.reader, time: event.time });
            }
        });
    }
}

function sendLoginDetails() {
    console.log(JSON.stringify(friendList));
    console.log(friendList);
    wsClients.forEach((client) => {
        client.sendUTF(JSON.stringify({
            type: 'loginInfo',
            yourFbId,
            friendList: JSON.stringify(friendList),
        }));
    });
}

function getFriendList(callback) {
    fbApi.getFriendsList((err, arr) => {
        if (err) {
            console.error('Error while getting friend list');
            console.error(err);
            return;
        }

        friendList = arr;

        fs.writeFile(friendListFile, JSON.stringify(friendList));

        if (typeof callback === 'function') {
            callback();
        }
    });
}

function sendRecentThreads(wsID) {
    let tmpArr = threads.map((thread, index) => ({ index, last: thread.lastMessageTime }));
    const rescentThreads = [];
    // sort indexes in descending times
    tmpArr.sort((a, b) => (b.last - a.last));
    // get first 5 indexes
    tmpArr = tmpArr.slice(0, 5);
    tmpArr.forEach((thread) => {
        rescentThreads[thread.index] = threads[thread.index];
    });

    wsClients[wsID].sendUTF(JSON.stringify({
        type: 'recentThreads',
        threads: JSON.stringify(rescentThreads),
    }));
}

console.log('Trying to restore session');
if (fs.existsSync(savedSessionFile)) {
    fbApi = facebookChatApi({ appState: JSON.parse(fs.readFileSync(savedSessionFile, 'utf8')) }, (err, api) => {
        if (err) {
            console.error(err);
            console.warn(`Moving session file to ${savedSessionFile}.bak`);
            fs.renameSync(savedSessionFile, `${savedSessionFile}.bak`);
            return;
        }

        console.log('Restored session correctly');
        fbApi = api;
        userLogged = true;

        // api stuff

        yourFbId = api.getCurrentUserID();

        if (fs.existsSync(friendListFile)) {
            friendList = JSON.parse(fs.readFileSync(friendListFile));
            sendLoginDetails();
        } else {
            console.warn('Friend list file not found, creating one');
            getFriendList(() => sendLoginDetails());
        }

        api.setOptions({ listenEvents: true, selfListen: true });

        api.listen((err2, event) => fbListener(err2, event, wsClients, addNewMessage, readMessage));
    });
} else {
    console.log('Session file not found');
}


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

    connection.sendUTF(JSON.stringify({
        type: 'hello',
        userLogged,
    }));

    sendLoginDetails();

    sendRecentThreads(id);

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

                    yourFbId = api.getCurrentUserID();

                    console.log('Logged in correctly');
                    connection.sendUTF(JSON.stringify({
                        type: 'info',
                        info: 'Logged in',
                    }));
                    sendLoginDetails();
                    fs.writeFileSync(savedSessionFile, JSON.stringify(api.getAppState()));
                    fbApi = api;
                    userLogged = true;

                    api.setOptions({ listenEvents: true, selfListen: true });

                    api.listen((err2, event) => fbListener(err2, event, wsClients, threads));
                });
                break;
            }

            case 'message': {
                fbApi.sendMessage(parsedData.body, parsedData.id);
                break;
            }

            case 'sendMessage': {
                fbApi.sendMessage('test', 100000000000000);
                break;
            }

            case 'updateFriendList': {
                getFriendList(() => JSON.stringify(friendList));
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
