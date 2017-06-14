import React from 'react';
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
            mail: '',
            password: '',
        };
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
                                <FormGroup>
                                    <Col componentClass={ControlLabel} xs={2}>
                                        Email:
                                    </Col>
                                    <Col sm={10} xs={12}>
                                        <FormControl
                                            type="email"
                                            onChange={e => this.handleInputChange('mail', e)}
                                            placeholder="Email"
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup>
                                    <Col componentClass={ControlLabel} xs={2}>
                                        Password:
                                    </Col>
                                    <Col sm={10} xs={12}>
                                        <FormControl
                                            type="password"
                                            onChange={e => this.handleInputChange('password', e)}
                                            placeholder="Password"
                                        />
                                    </Col>
                                </FormGroup>
                                <FormGroup>
                                    <Col xs={12} sm={3} smOffset={9}>
                                        <Button bsSize="large" block>Login</Button>
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
