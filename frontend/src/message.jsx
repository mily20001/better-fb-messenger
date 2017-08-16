import React from 'react';
import PropTypes from 'prop-types';
import {
    Col,
    Row,
    Well,
} from 'react-bootstrap';

import messageStatus from './message_statuses';

export default class Message extends React.Component {
    render() {
        if (this.props.isYour) {
            const msgStyle = {
                backgroundColor: this.props.status === messageStatus.READ ? 'green' : 'red',
            };
            return (
                <Row>
                    <Col xs={10} xsOffset={2}>
                        <Well className="message" style={msgStyle} bsSize="small">
                            {this.props.body}
                        </Well>
                    </Col>
                </Row>
            );
        }

        const msgStyle = {
            backgroundColor: 'blue',
        };

        return (
            <Row>
                <Col xs={10}>
                    <Well className="message" style={msgStyle} bsSize="small">
                        {this.props.body}
                    </Well>
                </Col>
            </Row>
        );
    }
}

Message.propTypes = {
    isYour: PropTypes.bool.isRequired,
    author: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    status: PropTypes.number,
};

Message.defaultProps = {
    status: messageStatus.SENT,
};
