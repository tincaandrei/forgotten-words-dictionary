import React, { Component } from 'react';
import { createWord } from './api';

class AddWordPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      term: '',
      definition: '',
      examples: '',
      submitting: false,
      error: null,
      success: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    const { name, value } = event.target;
    this.setState({ [name]: value, error: null, success: null });
  }

  async handleSubmit(event) {
    event.preventDefault();
    const term = this.state.term.trim();
    const definition = this.state.definition.trim();
    const examples = this.state.examples.trim();
    const createdBy =
      localStorage.getItem('currentUserName') ||
      this.props.currentUserName ||
      '';

    if (!term || !definition) {
      this.setState({
        error: 'Term and definition are required.'
      });
      return;
    }

    if (!createdBy) {
      this.setState({
        error:
          'No user name found. Please refresh and set your name again.'
      });
      return;
    }

    this.setState({ submitting: true, error: null });

    try {
      await createWord({
        term,
        definition,
        examples: examples || null,
        created_by: createdBy
      });

      this.setState({
        term: '',
        definition: '',
        examples: '',
        submitting: false,
        success: 'Word saved successfully!'
      });
    } catch (err) {
      this.setState({
        error: err.message || 'Failed to add word.',
        submitting: false
      });
    }
  }

  render() {
    return (
      <div className="card-panel">
        <h2 className="page-title">Add a new word</h2>
        <form onSubmit={this.handleSubmit} className="form-grid">
          <div>
            <label>
              Term (required)
              <input
                type="text"
                name="term"
                value={this.state.term}
                onChange={this.handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Definition (required)
              <textarea
                name="definition"
                rows="3"
                value={this.state.definition}
                onChange={this.handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Examples (optional)
              <textarea
                name="examples"
                rows="2"
                value={this.state.examples}
                onChange={this.handleChange}
              />
            </label>
          </div>
          {this.state.error && (
            <div className="status-text">{this.state.error}</div>
          )}
          {this.state.success && (
            <div className="success-text">{this.state.success}</div>
          )}
          <button
            className="primary-btn"
            type="submit"
            disabled={this.state.submitting}
          >
            {this.state.submitting ? 'Saving...' : 'Save word'}
          </button>
        </form>
      </div>
    );
  }
}

export default AddWordPage;

