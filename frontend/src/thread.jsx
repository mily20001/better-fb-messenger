import React from 'react';
import PropTypes from 'prop-types';
import {
    Panel,
} from 'react-bootstrap';

import Message from './message';

export default class Thread extends React.Component {
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
            <div>
                <Panel header={this.props.name} bsStyle="primary">
                    {messages}
                </Panel>
            </div>
        );
    }
}

Thread.propTypes = {
    messages: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired,
};
