import React from 'react';

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mail: '',
            password: '',
        };
    }
    render() {
        return (
            <div>
                <div>Login here:</div>
                <b>Email: </b> <input type="text" /> <br />
                <i>Password:</i> <input type="password" />
            </div>
        );
    }
}
