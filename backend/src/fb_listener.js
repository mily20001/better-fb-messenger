export default function fbListener(err, event, wsClients, addNewMessage, readMessage) {
    console.log(event);
    if (event.type === 'message') {
        addNewMessage(event);
        wsClients.forEach((client) => {
            client.sendUTF(JSON.stringify({ type: 'message', event }));
        });
    } else if (event.type === 'event') {
        wsClients.forEach((client) => {
            client.sendUTF(JSON.stringify({ type: 'chat-event', event }));
        });
    } else if (event.type === 'typ') {
        wsClients.forEach((client) => {
            client.sendUTF(JSON.stringify({ type: 'typing', event }));
        });
    } else if (event.type === 'read') {
        readMessage(true, event);
        wsClients.forEach((client) => {
            client.sendUTF(JSON.stringify({ type: 'you_read', event }));
        });
    } else if (event.type === 'read_receipt') {
        readMessage(false, event);
        wsClients.forEach((client) => {
            client.sendUTF(JSON.stringify({ type: 'read_receipt', event }));
        });
    } else if (event.type === 'message_reaction') {
        wsClients.forEach((client) => {
            client.sendUTF(JSON.stringify({ type: 'message_reaction', event }));
        });
    } else if (event.type === 'presence') {
        wsClients.forEach((client) => {
            client.sendUTF(JSON.stringify({ type: 'presence', event }));
        });
    }
}
