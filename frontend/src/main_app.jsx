import React from 'react';
import ReactDOM from 'react-dom';
import {
    BrowserRouter as Router,
    Route,
    Redirect,
} from 'react-router-dom';
import NotificationSystem from 'react-notification-system';

import Home from './home';
import Login from './login';
import Modal from './modal';

class Main extends React.Component {
    constructor() {
        super();
        this.state = {
            webSocketReconnectingId: 0,
            threads: {},
            yourFbId: undefined,
            friendList: [],
            isModalOpen: false,
            modalContent: (<div>Loading...</div>),
        };
        this.openWebSocket = this.openWebSocket.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.openModal = this.openModal.bind(this);
    }

    componentWillMount() {
        this.openWebSocket();
        this.setState({
            userLogged: null,
            threads: {},
        });
    }

    componentDidMount() {
        this.notificationSystem = this.refs.notificationSystem;
    }

    getName(id) {
        let name = id.toString();
        this.state.friendList.forEach((person) => {
            if (person.userID === id) {
                name = person.fullName;
            }
        });
        return name;
    }

    closeModal() {
        this.setState({ isModalOpen: false });
    }

    openModal(content) {
        this.setState({
            isModalOpen: true,
            modalContent: content === undefined ? (<div>Loading...</div>) : (content) });
    }

    openWebSocket() {
        console.log('opening websocket');
        try {
            this.webSocket = new WebSocket(`ws://${window.location.host}`, 'echo-protocol');
            this.webSocket.onopen = () => {
                console.log('Websocket opened');
                clearInterval(this.state.webSocketReconnectingId);
                this.setState({ webSocketReconnectingId: 0 });
            };

            this.webSocket.addEventListener('message', (e) => {
                const msg = JSON.parse(e.data);
                console.log('Received message via websocket');
                console.log(msg);
                this.setState({ userLogged: msg.userLogged });

                if (msg.type === 'hello') {
                    this.notificationSystem.addNotification({
                        title: 'Received hello message',
                        message: `You are ${msg.userLogged ? 'logged' : 'not logged'} in`,
                        level: 'info',
                    });
                }
                if (msg.type === 'loginInfo') {
                    this.setState({
                        friendList: JSON.parse(msg.friendList),
                        yourFbId: msg.yourFbId,
                    });
                }
                if (msg.type === 'recentThreads') {
                    const currentThreads = { ...this.state.threads };
                    const tmpThreads = JSON.parse(msg.threads);
                    Object.keys(tmpThreads).forEach((index) => {
                        currentThreads[index] = {
                            name: this.getName(index),
                            id: parseInt(index, 10),
                            messages: [],
                            isGroup: tmpThreads[index].isGroup,
                            unreadCount: tmpThreads[index].unreadCount,
                            isTyping: false,
                        };

                        currentThreads[index].messages = tmpThreads[index].messages.map(fbMsg => ({
                            id: fbMsg.id,
                            attachments: fbMsg.attachments,
                            isYour: fbMsg.senderID === this.state.yourFbId,
                            body: fbMsg.body,
                            author: this.getName(fbMsg.senderID),
                            timestamp: fbMsg.timestamp,
                            mentions: fbMsg.mentions,
                            isUnread: fbMsg.isUnread,
                            readers: fbMsg.readers,
                            emojis: fbMsg.emojis,
                            emojisOnly: fbMsg.emojisOnly,
                        }));
                    });

                    this.setState({ threads: currentThreads });
                }
                if (msg.type === 'message') {
                    if (msg.event.senderID !== this.state.yourFbId) {
                        this.notificationSystem.addNotification({
                            title: `New message from ${msg.event.senderID}`,
                            message: msg.event.body,
                            level: 'info',
                        });
                    }

                    // TODO add support for mentions, readers, isUnread props
                    const parsedMsg = {
                        id: msg.event.messageID,
                        isYour: msg.event.senderID === this.state.yourFbId,
                        body: msg.event.body,
                        timestamp: msg.event.timestamp,
                        author: this.getName(msg.event.senderID),
                        attachments: msg.event.attachments,
                        emojis: msg.event.emojis,
                        emojisOnly: msg.event.emojisOnly,
                    };

                    const tmpThreads = { ...this.state.threads };
                    // console.log(tmpThreads);
                    if (!(msg.event.threadID in tmpThreads)) {
                        tmpThreads[msg.event.threadID] = {
                            name: this.getName(msg.event.threadID),
                            id: parseInt(msg.event.threadID, 10),
                            messages: [],
                            isTyping: false,
                        };
                    }
                    tmpThreads[msg.event.threadID].messages.push(parsedMsg);
                    this.setState({ threads: tmpThreads });
                }
                if (msg.type === 'info') {
                    if (msg.info === 'Logged in') {
                        this.setState({ userLogged: true });
                    }
                    this.notificationSystem.addNotification({
                        message: msg.info,
                        level: 'info',
                    });
                }
                if (msg.type === 'typing') {
                    if (msg.event.threadID === this.state.yourFbId) {
                        if (msg.event.userID in this.state.threads) {
                            const tmpThreads = { ...this.state.threads };
                            tmpThreads[msg.event.userID].isTyping = msg.event.isTyping;
                            this.setState({ threads: tmpThreads });
                        }
                    } else if (msg.event.threadID in this.state.threads) {
                        // group chat, id of typing user is event.from
                        const tmpThreads = { ...this.state.threads };
                        tmpThreads[msg.event.threadID].isTyping = msg.event.isTyping;
                        this.setState({ threads: tmpThreads });
                    }
                }
                if (msg.type === 'resolvedPhotoUrl') {
                    if (msg.url === 'error') {
                        this.setState({ modalContent: (<div>Error while loading image!</div>) });
                    } else {
                        this.setState({ modalContent: (<img src={msg.url} alt="big" />) });
                    }
                }
                if (msg.type === 'error') {
                    this.notificationSystem.addNotification({
                        message: msg.error,
                        level: 'error',
                    });
                }
            });

            const reconnectHandler = () => {
                if (this.state.webSocketReconnectingId !== 0) {
                    return;
                }

                const id = setInterval(this.openWebSocket, 1000);
                this.setState({ webSocketReconnectingId: id });
            };

            this.webSocket.onclose = (e) => {
                console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
                reconnectHandler();
            };
            this.webSocket.onerror = (e) => {
                console.log('Socket is closed because of ERROR. Reconnect will be attempted in 1 second.', e.message);
                reconnectHandler();
            };
        } catch (e) {
            console.log(`Websocket error: ${e}`);
        }
    }

    render() {
        return (
            <Router className="full-page">
                <div className="full-page">
                    {['/', '/index', '/index.html'].map(path =>
                        (<Route
                            key={path}
                            exact
                            path={path}
                            render={() =>
                                (<Home
                                    threads={this.state.threads}
                                    webSocket={this.webSocket}
                                    openModal={this.openModal}
                                />)
                            }
                        />))}
                    <Route path="/login" render={() => <Login webSocket={this.webSocket} />} />
                    {(this.state.userLogged === false) ?
                        <Redirect push to="/login" /> : <Redirect push to="/" />}
                    <NotificationSystem ref="notificationSystem" />
                    <Modal
                        content={this.state.modalContent}
                        isOpen={this.state.isModalOpen}
                        closeModal={this.closeModal}
                    />
                </div>
            </Router>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('root'));
