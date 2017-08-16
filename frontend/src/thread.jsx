import React from 'react';
import PropTypes from 'prop-types';
import {
    FormControl,
    Panel,
} from 'react-bootstrap';

import Message from './message';

export default class Thread extends React.Component {
    constructor() {
        super();
        this.state = {
            newMessageText: '',
        };
        this.handleNewMessageChange = this.handleNewMessageChange.bind(this);
    }

    handleNewMessageChange(e) {
        console.log(e.target.value);
        this.setState({ newMessageText: e.target.value });
    }

    render() {
        const messages = this.props.messages.map(msg =>
            (<Message
                key={msg.id}
                isYour={msg.isYour}
                author={msg.author}
                body={msg.body}
                timestamp={msg.timestamp}
                status={msg.status}
            />));
        return (
            <div className="thread-box panel panel-primary">
                <div className="panel-heading">{this.props.name}</div>
                <div className="thread-body">
                    <div className="thread-messages">
                        {messages}
                    </div>

                    <FormControl
                        type="text"
                        value={this.state.newMessageText}
                        placeholder="Enter message"
                        onChange={this.handleNewMessageChange}
                        className="message-input"
                    />
                </div>
            </div>
        );
    }
}

Thread.propTypes = {
    messages: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired,
};
