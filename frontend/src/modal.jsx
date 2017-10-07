import React from 'react';
import PropTypes from 'prop-types';

export default class Modal extends React.Component {
    render() {
        if (!this.props.isOpen) return (<div />);
        return (
            <div className="modal-background" onClick={this.props.closeModal}>
                <div className="modal-box" onClick={this.props.closeModal}>
                    {this.props.content}
                </div>
            </div>
        );
    }
}

Modal.propTypes = {
    content: PropTypes.object.isRequired,
    isOpen: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
};
