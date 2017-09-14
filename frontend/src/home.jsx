import React from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';
import {
    Button,
} from 'react-bootstrap';
import Thread from './thread';

export default class Home extends React.Component {
    render() {
        const threads = Object.keys(this.props.threads).map(key =>
            (<Thread
                messages={this.props.threads[key].messages}
                name={this.props.threads[key].name}
                webSocket={this.props.webSocket}
                threadId={this.props.threads[key].id}
            />));

        return (
            <div>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/login">Login</Link></li>
                </ul>
                <Button onClick={() => this.props.webSocket.send(JSON.stringify({ type: 'sendMessage' }))}>
                    Send test message
                </Button>
                {threads}
            </div>
        );
    }
}

Home.propTypes = {
    webSocket: PropTypes.object.isRequired,
    threads: PropTypes.object.isRequired,
};
