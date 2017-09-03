import React from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Grid,
    Row,
    Col,
    Form,
    FormControl,
    FormGroup,
    ControlLabel,
    Well,
} from 'react-bootstrap';

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
        };
    }

    getValidationState(field) {
        if (this.state[field].length < 1) return null;
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const wyn = re.test(this.state[field]);
        if (wyn === false) {
            return 'warning';
        }

        return 'success';
    }

    sendLogin() {
        console.log({ ...this.state, type: 'login' });
        this.props.webSocket.send(JSON.stringify({ ...this.state, type: 'login' }));
    }

    handleInputChange(field, newValue) {
        this.setState({ [field]: newValue });
    }

    render() {
        const wellStyle = { borderRadius: '20px' };
        const gridStyle = { position: 'relative', top: '50%', transform: 'translateY(-50%)' };
        return (
            <Grid style={gridStyle}>
                <Row>
                    <Col xs={12} sm={10} md={8} smOffset={1} mdOffset={2}>
                        <Well style={wellStyle}>
                            <h2>Facebook login</h2>
                            <Form horizontal>
                                <FormGroup validationState={this.getValidationState('email')}>
                                    <Col componentClass={ControlLabel} xs={2}>
                                        Email:
                                    </Col>
                                    <Col sm={10} xs={12}>
                                        <FormControl
                                            type="email"
                                            onChange={e => this.handleInputChange('email', e.target.value)}
                                            placeholder="Email"
                                        />
                                        <FormControl.Feedback />
                                    </Col>
                                </FormGroup>
                                <FormGroup>
                                    <Col componentClass={ControlLabel} xs={2}>
                                        Password:
                                    </Col>
                                    <Col sm={10} xs={12}>
                                        <FormControl
                                            type="password"
                                            onChange={e => this.handleInputChange('password', e.target.value)}
                                            placeholder="Password"
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup>
                                    <Col xs={12} sm={3} smOffset={9}>
                                        <Button
                                            bsSize="large"
                                            block
                                            onClick={() => { this.sendLogin(); }}
                                        >
                                            Login
                                        </Button>
                                    </Col>
                                </FormGroup>
                            </Form>
                        </Well>
                    </Col>
                </Row>
            </Grid>
        );
    }
}

Login.propTypes = {
    webSocket: PropTypes.object.isRequired,
};
