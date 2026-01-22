import React, { Component } from 'react';
import { checkAccess } from './api';
import './styles/AccessCodeScreen.css';

class AccessCodeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accessCode: '',
      name: '',
      error: null,
      submitting: false
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleInputChange(event) {
    const { name, value } = event.target;
    this.setState({
      [name]: value,
      error: null
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    const accessCode = this.state.accessCode.trim();
    const name = this.state.name.trim();

    if (!name) {
      this.setState({ error: 'Please tell us who you are.' });
      return;
    }

    if (!accessCode) {
      this.setState({ error: 'Please enter the Blandiana code.' });
      return;
    }

    this.setState({ submitting: true, error: null });

    try {
      await checkAccess(accessCode);
      localStorage.setItem('hasAccess', 'true');
      localStorage.setItem('currentUserName', name);
      localStorage.setItem('currentUserNameSetAt', String(Date.now()));

      if (this.props.onNameSelected) {
        this.props.onNameSelected(name);
      }

      if (this.props.onAccessGranted) {
        this.props.onAccessGranted();
      }
    } catch (err) {
      this.setState({
        error: err.message || 'Invalid Blandiana code.',
        submitting: false
      });
      return;
    }
  }

  render() {
    const { accessCode, name, error, submitting } = this.state;
    const { theme, onToggleTheme } = this.props;
    const themeLabel =
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

    return (
      <div className="access-screen">
        <div className="access-card simple">
          {onToggleTheme && (
            <div className="access-theme-toggle">
              <button type="button" onClick={onToggleTheme}>
                {themeLabel}
              </button>
            </div>
          )}
          <img
            className="access-logo"
            src="/dict_logo.png"
            alt="Blandiana Dictionary logo"
          />
          <h2>Blandiana Dictionary</h2>
          <p className="access-subtitle">
            Enter your name and the shared Blandiana access code.
          </p>

          <form onSubmit={this.handleSubmit} className="access-form">
            <label className="form-group">
              <span className="form-label">Your name</span>
              <input
                type="text"
                name="name"
                value={name}
                onChange={this.handleInputChange}
              />
            </label>

            <label className="form-group">
              <span className="form-label">Access code</span>
              <input
                type="password"
                name="accessCode"
                value={accessCode}
                onChange={this.handleInputChange}
                placeholder="Blandiana code"
              />
            </label>

            {error && <div className="access-error">{error}</div>}

            <button type="submit" disabled={submitting} className="access-btn">
              {submitting ? 'Checking...' : 'Enter Blandiana dictionary'}
            </button>
          </form>
        </div>
      </div>
    );
  }
}

export default AccessCodeScreen;
