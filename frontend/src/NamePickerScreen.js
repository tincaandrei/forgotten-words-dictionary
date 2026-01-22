import React, { Component } from 'react';

class NamePickerScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      error: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({
      name: event.target.value,
      error: null
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const name = this.state.name.trim();

    if (!name) {
      this.setState({ error: 'Please tell us who you are.' });
      return;
    }

    localStorage.setItem('currentUserName', name);
    localStorage.setItem('currentUserNameSetAt', String(Date.now()));
    if (this.props.onNameSelected) {
      this.props.onNameSelected(name);
    }
  }

  render() {
    return (
      <div style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/dict_logo.png"
            alt="Blandiana Dictionary logo"
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              objectFit: 'contain',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}
          />
        </div>
        <h2>Who are you?</h2>
        <form onSubmit={this.handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Name:
              <input
                type="text"
                value={this.state.name}
                onChange={this.handleChange}
                placeholder="e.g. Name... "
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
              />
            </label>
          </div>
          {this.state.error && (
            <div style={{ color: 'red', marginBottom: '1rem' }}>
              {this.state.error}
            </div>
          )}
          <button type="submit">Continue</button>
        </form>
      </div>
    );
  }
}

export default NamePickerScreen;
