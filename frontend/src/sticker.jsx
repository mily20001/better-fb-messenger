import React from 'react';
import PropTypes from 'prop-types';

export default class Sticker extends React.Component {
    constructor() {
        super();
        this.state = {
            stickerStyle: {},
            currentFrame: 0,
        };

        this.updateStyle = this.updateStyle.bind(this);
    }

    componentDidMount() {
        if (this.props.sticker.frameCount > 1) {
            this.updateStyle();
        }
    }

    updateStyle() {
        let nextFrame = this.state.currentFrame + 1;
        if (nextFrame === this.props.sticker.frameCount) {
            nextFrame = 0;
        }
        const nextRow = parseInt(nextFrame / this.props.sticker.framesPerRow, 10);
        const nextCol = nextFrame % this.props.sticker.framesPerRow;

        const newStyle = {
            width: `${this.props.sticker.width}`,
            height: `${this.props.sticker.height}`,
            backgroundImage: `url('${this.props.sticker.spriteURI}')`,
            backgroundPosition: `${-(nextCol * this.props.sticker.height)}px ${-(nextRow * this.props.sticker.width)}px`,
        };

        this.setState({ stickerStyle: newStyle, currentFrame: nextFrame });

        setTimeout(this.updateStyle, this.props.sticker.frameRate);
    }

    render() {
        return (
            <div
                key={this.props.sticker.filename}
                alt="sticker"
                style={this.state.stickerStyle}
            />
        );
    }
}

Sticker.propTypes = {
    sticker: PropTypes.object.isRequired,
};
