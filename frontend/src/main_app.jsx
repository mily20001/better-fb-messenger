import React from 'react';
import ReactDOM from 'react-dom';
import {
    BrowserRouter as Router,
    Route,
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
        this.setState({ threads: {
            Norbi: [
                {
                    id: 'asdasdasdw340t',
                    isYour: false,
                    body: 'hejka naklejka',
                    timestamp: 1498584764412,
                    author: 'Norbi',
                },
                {
                    id: 'asdadfsdasdw340t',
                    isYour: true,
                    body: 'hello',
                    timestamp: 1498584784412,
                    author: 'Milosz',
                    status: 0,
                },
                {
                    id: 'asdadfsdasdw341t',
                    isYour: true,
                    body: 'it\'s me',
                    timestamp: 1498584794412,
                    author: 'Milosz',
                    status: 2,
                },
                {
                    id: 'asdasfadasdw340t',
                    isYour: false,
                    body: 'hejka naklejka',
                    timestamp: 1498584764412,
                    author: 'Norbi',
                },
                {
                    id: 'asdasddasdw340t',
                    isYour: false,
                    body: 'hejka naklejka',
                    timestamp: 1498584764412,
                    author: 'Norbi',
                },
                {
                    id: 'asdaasdasdw340t',
                    isYour: false,
                    body: 'hejka naklejka',
                    timestamp: 1498584764412,
                    author: 'Norbi',
                },
                {
                    id: 'asdasdassdw340t',
                    isYour: false,
                    body: 'hejka naklejka',
                    timestamp: 1498584764412,
                    author: 'Norbi',
                },
            ],
        } });
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
                if (msg.type === 'hello') {
                    this.notificationSystem.addNotification({
                        title: 'Received hello message',
                        message: `You are ${msg.userLogged ? 'logged' : 'not logged'} in`,
                        level: 'info',
                    });
                }
                if (msg.type === 'info') {
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
                    <NotificationSystem ref="notificationSystem" />
                </div>
            </Router>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('root'));
