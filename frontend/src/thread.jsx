import React from 'react';
import PropTypes from 'prop-types';
import {
    FormControl,
} from 'react-bootstrap';

import Message from './message';

export default class Thread extends React.Component {
    constructor(props) {
        super();
        this.state = {
            newMessageText: '',
        };
        this.bottomName = `bottomOfThread${props.threadId}`;
        this.handleNewMessageChange = this.handleNewMessageChange.bind(this);
        this.keyPress = this.keyPress.bind(this);
    }

    componentDidUpdate() {
        this.refs[this.bottomName].scrollIntoView({ block: 'end', behavior: 'smooth' });
    }

    handleNewMessageChange(e) {
        console.log(e.target.value);
        this.setState({ newMessageText: e.target.value });
    }

    keyPress(e) {
        if (e.keyCode === 13) {
            console.log(`enter pressed: ${e.target.value}`);
            this.props.webSocket.send(JSON.stringify({ type: 'message', body: e.target.value, id: this.props.threadId }));
            this.setState({ newMessageText: '' });
        }
    }

    render() {
        const typing = this.props.isTyping ? 'typing' : '';
        const messages = this.props.messages.map(msg =>
            (<Message
                key={msg.id}
                isYour={msg.isYour}
                author={msg.author}
                body={msg.body}
                timestamp={msg.timestamp}
                status={msg.status}
                attachments={msg.attachments}
                emojis={msg.emojis}
                emojisOnly={msg.emojisOnly}
            />));
        return (
            <div
                className="thread-box panel panel-primary"
            >
                <div className="panel-heading">{this.props.name}</div>
                <div className="thread-body">
                    <div className="thread-messages">
                        {messages}
                        {typing}
                        <div ref={this.bottomName} />
                    </div>

                    <FormControl
                        type="text"
                        value={this.state.newMessageText}
                        placeholder="Enter message"
                        onChange={this.handleNewMessageChange}
                        className="message-input"
                        onKeyDown={this.keyPress}
                    />
                </div>
            </div>
        );
    }
}

Thread.propTypes = {
    messages: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired,
    webSocket: PropTypes.object.isRequired,
    threadId: PropTypes.number.isRequired,
    isTyping: PropTypes.bool.isRequired,
};
