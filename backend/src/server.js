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

const threads = {};

const savedSessionFile = 'facebookSession.json';
const friendListFile = 'facebookFriendList.json';

function parseEmojis(message) {
    const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

    let parsed = message;
    const emojis = [];

    let match = regex.exec(message);
    while (match !== null) {
        parsed = parsed.replace(match[0], '');
        emojis.push(fbApi.getEmojiUrl(match[0], 128, 1.0));
        match = regex.exec(parsed);
    }

    return { emojis, emojisOnly: parsed.length === 0 };
}

function addNewMessage(message) {
    if (!(message.threadID in threads)) {
        console.log('Adding new thread');
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

    const tmpObj = parseEmojis(message.body);
    message.emojis = tmpObj.emojis;
    message.emojisOnly = tmpObj.emojisOnly;


    const msg = {
        attachments: message.attachments,
        body: message.body,
        mentions: message.mentions,
        id: message.messageID,
        senderID: message.senderID,
        isUnread: message.isUnread,
        timestamp: parseInt(message.timestamp, 10),
        readers: [],
        emojis: message.emojis,
        emojisOnly: message.emojisOnly,
    };

    console.log('timestamp: ', msg.timestamp);

    if (msg.isUnread && msg.senderID === yourFbId) threads[message.threadID].unreadCount++;

    threads[message.threadID].lastMessageTime = msg.timestamp;
    threads[message.threadID].messages.push(msg);

    if (threads[message.threadID].messages.length > MAX_MESSAGES_PER_THREAD) {
        threads[message.threadID].messages.shift();
    }
    console.log('Threads after adding message: ', JSON.stringify(threads));
    console.log(threads[message.threadID]);
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
    // console.log(JSON.stringify(friendList));
    // console.log(friendList);
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
    console.log('threads: ', JSON.stringify(threads));
    let tmpArr = Object.keys(threads).map(index => ({
        index,
        last: threads[index].lastMessageTime,
    }));

    const rescentThreads = {};
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

            case 'resolvePhotoUrl': {
                fbApi.resolvePhotoUrl(parsedData.photoID, (err, url) => {
                    if (err) {
                        connection.sendUTF(JSON.stringify({
                            type: 'resolvedPhotoUrl',
                            photoID: parsedData.photoID,
                            url: 'error',
                        }));
                        return;
                    }
                    connection.sendUTF(JSON.stringify({
                        type: 'resolvedPhotoUrl',
                        photoID: parsedData.photoID,
                        url,
                    }));
                });
                break;
            }

            case 'updateFriendList': {
                getFriendList(() => JSON.stringify(friendList));
                break;
            }
            //
            // case 'getEmojiUrl': {
            //     // TODO add url caching
            //     const url = fbApi.getEmojiUrl(parsedData.emoji, 128);
            //     connection.sendUTF(JSON.stringify({
            //         type: 'emojiUrl',
            //         url,
            //     }));
            //     break;
            // }

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
