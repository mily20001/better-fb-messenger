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
        const attachments = [];

        this.props.attachments.forEach((att) => {
            if (att.type === 'photo') {
                attachments.push(<img src={att.largePreviewUrl} alt="facebook-img" />);
            }
        });

        if (this.props.isYour) {
            const msgStyle = {
                backgroundColor: this.props.status === messageStatus.READ ? 'green' : 'red',
            };
            return (
                <Row>
                    <Col xs={10} xsOffset={2}>
                        <Well className="message" style={msgStyle} bsSize="small">
                            {this.props.body}
                            {attachments}
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
    attachments: PropTypes.array,
};

Message.defaultProps = {
    status: messageStatus.SENT,
    attachments: [],
};
