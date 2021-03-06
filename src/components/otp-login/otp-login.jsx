import React, { Component } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';
import axios from 'axios';
import server from '../../services/server.service';
import { checkSubscription } from './utils';
import './otp-login.css'; 
import langSet from './lang';

export default class OtpLogin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      view: 'view',
      email: '',
      captcha_0: '',
      captcha_1: '',
      membership: [],      
      password: '',
      token: '',
      captcha: {
        key: '',
        image_url: ''
      },
      popUp: {
        state: false,
        title: '',
        text: ''
      },
      lang: langSet['en']
    };

    this.refresh = this.refresh.bind(this);
    this.signup = this.signup.bind(this);
    this.login = this.login.bind(this);
    this.setPopUp = this.setPopUp.bind(this);
    this.resetPopUp = this.resetPopUp.bind(this);
    this.goToHome = this.goToHome.bind(this);
  }

  static propTypes = {
    signIn: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired, 
    user: PropTypes.object,
  }; 

  componentDidMount() {
    !this.state.captcha.key && this.refresh();
  } 

  async refresh(e) {
    e && e.preventDefault();
    try {
      const { data } = await axios.get(server.otp_api + '/otp/singup/');
      this.updateCaptcha(data);
    } catch(e) {
      this.setPopUp({
        title: 'Network Error',
        text: e
      });
    }
  }

  updateCaptcha(data) {
    if (data['key']) {
      const image_url = server.otp_api + data['image_url'];
      const key = data['key'];
      const membership = data['membership'];
      
      this.setState({
        view: 'email',
        captcha_0: key,
        membership,
        captcha_1: '',
        captcha: {
          key: key,
          image_url: image_url
        }
      });
    }
  }

  checkEmail = () => {
    const { email, captcha, membership } = this.state;
    const data = {
      key: captcha.key,
      email,
      membership,
    };

    return checkSubscription(data);
  }

  onEmailSubmit = async (e) => {
    e.preventDefault(); 
    const isIncluded = this.checkEmail();
    const { title, text } = this.state.lang.membershipError;

    isIncluded 
    ? this.signup()
    : this.setPopUp({
        title,
        text: <p>{text}<b>organizations@infinity.family</b></p>
      });
  }

  signup = async (e) => {
    try {
      const { email, captcha_0, captcha_1 } = this.state;
      if (!email || !captcha_1) {
        this.setPopUp({
          title: 'Sign In Error',
          text: 'All fields should be fill out.'
        });
        return;
      }
      
      const params = { email, captcha_0, captcha_1 };
      const { data } = await axios.post(server.otp_api + '/otp/singup/', params);

      this.setState({
        token: data['token'],
        view: 'login',
      });
    } catch(e) {
      if (e.response.status === 400) {
        this.setPopUp({
          title: 'Sign In Error',
          text: 'Wrong code. Try again.'
        });
      }
    }
  }

  async login(e) {
    e.preventDefault();
    
    try {
      const { token, password, email } = this.state;
      if (!password) {
        this.setPopUp({
          title: 'Sign In Error',
          text: 'The filed should be fill out.'
        });
        return;
      }
      
      const headers = { 'Authorization': 'Token ' + token };
      await axios.post(server.otp_api + '/otp/login/', { password }, { headers });
      const { data } = await axios.get(server.otp_api + '/rest-auth/user/', { params: { email }, headers });
      this.props.signIn({ token, ...data });
      this.goToHome();
    } catch(e) {

      if (e.response.status === 400) {
        this.setPopUp({
          title: 'Sign In Error',
          text: 'Wrong code. Try again.'
        });
      } else {
        this.setPopUp({
          title: 'Something went wrong.',
          text: 'Try again.'
        });
      }
    }
  }

  goToHome() {
    this.props.history.push('/');
  }

  setPopUp({ title, text }) {
    this.setState({
      popUp: {
        state: true,
        title,
        text,
      }
    });
  }

  resetPopUp() {

    this.setState({
      popUp: {
        state: false,
        title: '',
        text: ''
      }
    });
  }

  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    }); 
  } 

  render() {
    const { 
      view, 
      email, 
      captcha_0, 
      captcha_1, 
      captcha, 
      password, 
      popUp
    } = this.state;

    const PopUp = () => 
      <div >
        <Modal show={popUp.state} className="otp__modal">
          <Modal.Header>
            <Modal.Title>{popUp.title}</Modal.Title>
          </Modal.Header> 
          <Modal.Body>
            {popUp.text}
          </Modal.Body> 
          <Modal.Footer>
            <Button onClick={this.resetPopUp}>Close</Button> 
          </Modal.Footer> 
        </Modal>
      </div>;
    
    switch(view) {
      case 'email': {
        return (
          <div>
          <PopUp />
            <div className="center-block otp__box"> 
              <h1 className="otp__header">Sign In</h1>
              <form onSubmit={this.onEmailSubmit}>
                <div className="form-group">
                  <input 
                    className="form-control otp__input"
                    name="email" 
                    type="email" 
                    required
                    placeholder="E-mail address"
                    value={email} 
                    onChange={this.handleChange}
                  />
                </div>
                <div id="div_id_captcha" className="form-group">
                  <div className="row">
                  </div>
                  <div className="row">
                    <div className="col-md-8">
                      <input name="captcha_0" type="hidden" value={captcha_0} required />
                      <input 
                        className="form-control otp__input"
                        value={captcha_1} 
                        name="captcha_1" 
                        spellCheck="false"
                        placeholder="Captcha"
                        required 
                        onChange={this.handleChange}
                      />
                      </div>
                      <div className="otp__captcha">
                        <img src={captcha.image_url} alt="captcha" />
                        <a className="primaryAction btn otp__btn" onClick={this.refresh} >&#8634;</a>
                      </div>
                    </div>
                </div>
                <button type="submit" className="primaryAction btn btn-lg otp__btn">CONTINUE</button>
              </form>
            </div>   
          </div>
        ); 
      }
      case 'login': {
        return(
          <div>
            <PopUp />          
            <Alert bsStyle="info" className="otp__alert">
              <strong>One time password</strong> has been send to your email.
            </Alert>
            <div className="center-block otp__box">
              <form>
                <div className="form-group">
                  <input 
                    className="form-control otp__input" 
                    value={password} 
                    name="password" 
                    type="password"
                    placeholder="One time password"                    
                    required 
                    onChange={this.handleChange}
                  />
                </div>
                <button className="primaryAction btn otp__btn" onClick={this.refresh}>Resend token</button>
                <button className="btn btn-primary otp__btn" onClick={this.login}>Submit</button>
              </form>
            </div>
          </div>
        );
      }

      default:
        return null;
    } 
  }
}
