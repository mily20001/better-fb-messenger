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

class Main extends React.Component {
    constructor() {
        super();
        this.state = {
            webSocketReconnectingId: 0,
            threads: {},
        };
        this.openWebSocket = this.openWebSocket.bind(this);
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
                if (msg.type === 'message') {
                    this.notificationSystem.addNotification({
                        title: `New message from ${msg.event.senderID}`,
                        message: msg.event.body,
                        level: 'info',
                    });

                    const parsedMsg = {
                        id: msg.event.messageID,
                        isYour: msg.event.senderID !== msg.event.threadID,
                        body: msg.event.body,
                        timestamp: msg.event.timestamp,
                        author: msg.event.senderID,
                    };

                    const tmpThreads = { ...this.state.threads };
                    console.log(tmpThreads);
                    if (!(msg.event.threadID in tmpThreads)) {
                        tmpThreads[msg.event.threadID] = {
                            name: msg.event.threadID,
                            messages: [],
                        };
                    }
                    tmpThreads[msg.event.threadID].messages.push(parsedMsg);
                    this.setState({ threads: tmpThreads });
                }
                if (msg.type === 'info') {
                    if (msg.info === 'Logged in') {
                        this.setState({ userLogged: true});
                    }
                    this.notificationSystem.addNotification({
                        message: msg.info,
                        level: 'info',
                    });
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
                                />)
                            }
                        />))}
                    <Route path="/login" render={() => <Login webSocket={this.webSocket} />} />
                    {(this.state.userLogged === false) ? <Redirect push to="/login" /> : <Redirect push to="/" />}
                    <NotificationSystem ref="notificationSystem" />
                </div>
            </Router>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('root'));
