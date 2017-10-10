import React from 'react';
import PropTypes from 'prop-types';
import {
    Col,
    Row,
    Well,
} from 'react-bootstrap';

import messageStatus from './message_statuses';

export default class Message extends React.Component {

    shouldComponentUpdate() {
        // for now this component should never update,
        // in future it should update only on message read/delivery
        return false;
    }

    openBigImage(photoID) {
        this.props.webSocket.send(JSON.stringify({ type: 'resolvePhotoUrl', photoID }));
        this.props.openModal();
    }

    render() {
        const attachments = [];

        this.props.attachments.forEach((att) => {
            if (att.type === 'photo') {
                attachments.push(<img
                    className="message-img"
                    key={att.filename}
                    src={att.largePreviewUrl}
                    alt="facebook-img"
                    onClick={() => this.openBigImage(att.ID)}
                />);
            } else if (att.type === 'video') {
                attachments.push(<video
                    className="message-video"
                    key={att.filename}
                    src={att.url}
                />);
            } else if (att.type === 'sticker') {
                attachments.push(<img
                    className="message-sticker"
                    key={att.filename}
                    src={att.url}
                    width={att.width}
                    height={att.height}
                    alt="sticker"
                />);
            }
        });

        const body = [];

        const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

        let parsed = this.props.body;
        let lastSlice = 0;
        const emojisClass = this.props.emojisOnly ? 'emoji-big' : 'emoji-small';

        console.log('emojisonly: ', this.props.emojisOnly);

        let match = regex.exec(this.props.body);
        while (match !== null) {
            parsed = parsed.replace(match[0], '');
            body.push(parsed.substr(lastSlice, match.index - lastSlice));
            lastSlice = match.index;
            console.log('emoji url:', this.props.emojis[0]);
            body.push(<img className={emojisClass} src={`${this.props.emojis[0]}`} alt="emoji" />);
            this.props.emojis.shift();
            match = regex.exec(parsed);
        }

        console.log('lenght: ', parsed.length);

        body.push(parsed.substr(lastSlice));

        if (this.props.isYour) {
            const msgStyle = {
                backgroundColor: this.props.status === messageStatus.READ ? 'green' : 'red',
            };
            return (
                <Row>
                    <Col xs={10} xsOffset={2}>
                        <Well className="message" style={msgStyle} bsSize="small">
                            {body}
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
                        {body}
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
    emojisOnly: PropTypes.bool.isRequired,
    status: PropTypes.number,
    attachments: PropTypes.array,
    emojis: PropTypes.array,
    openModal: PropTypes.func.isRequired,
    webSocket: PropTypes.object.isRequired,
};

Message.defaultProps = {
    status: messageStatus.SENT,
    attachments: [],
    emojis: [],
};
