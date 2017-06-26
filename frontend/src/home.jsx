import React from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';
import {
    Button,
} from 'react-bootstrap';

export default class Home extends React.Component {
    render() {
        return (
            <div>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/login">Login</Link></li>
                </ul>
                <Button onClick={() => this.props.webSocket.send(JSON.stringify({ type: 'sendMessage' }))}>
                    Send test message
                </Button>
            </div>
        );
    }
}

Home.propTypes = {
    webSocket: PropTypes.object.isRequired,
};
