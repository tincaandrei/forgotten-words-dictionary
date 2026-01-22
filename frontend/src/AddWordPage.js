import React, { Component } from 'react';
import { createExpression, createWord } from './api';
import AudioRecorder from './AudioRecorder';

const buildAudioFileName = (term) => {
  const base = (term || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return `${base || 'word'}_sound.mp3`;
};

class AddWordPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'word',
      term: '',
      definition: '',
      examples: '',
      imageFile: null,
      audioFile: null,
      wordSubmitting: false,
      wordError: null,
      wordSuccess: null,
      expression: '',
      meaning: '',
      expressionExamples: '',
      expressionAudioFile: null,
      expressionSubmitting: false,
      expressionError: null,
      expressionSuccess: null
    };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleWordChange = this.handleWordChange.bind(this);
    this.handleExpressionChange = this.handleExpressionChange.bind(this);
    this.handleWordFileChange = this.handleWordFileChange.bind(this);
    this.handleWordSubmit = this.handleWordSubmit.bind(this);
    this.handleExpressionSubmit = this.handleExpressionSubmit.bind(this);
    this.handleWordRecordingReady = this.handleWordRecordingReady.bind(this);
    this.handleExpressionRecordingReady =
      this.handleExpressionRecordingReady.bind(this);
  }

  handleTabChange(mode) {
    this.setState({ mode });
  }

  handleWordChange(event) {
    const { name, value } = event.target;
    this.setState({ [name]: value, wordError: null, wordSuccess: null });
  }

  handleExpressionChange(event) {
    const { name, value } = event.target;
    this.setState({
      [name]: value,
      expressionError: null,
      expressionSuccess: null
    });
  }

  handleWordFileChange(event) {
    const { name, files } = event.target;
    const file = files && files[0] ? files[0] : null;
    this.setState({ [name]: file, wordError: null, wordSuccess: null });
  }

  handleWordRecordingReady(file) {
    this.setState({ audioFile: file, wordError: null, wordSuccess: null });
  }

  handleExpressionRecordingReady(file) {
    this.setState({
      expressionAudioFile: file,
      expressionError: null,
      expressionSuccess: null
    });
  }

  async handleWordSubmit(event) {
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
        wordError: 'Term and definition are required.'
      });
      return;
    }

    if (!createdBy) {
      this.setState({
        wordError:
          'No user name found. Please refresh and set your name again.'
      });
      return;
    }

    this.setState({ wordSubmitting: true, wordError: null });

    try {
      await createWord({
        term,
        definition,
        examples: examples || null,
        created_by: createdBy,
        imageFile: this.state.imageFile,
        audioFile: this.state.audioFile
      });

      this.setState({
        term: '',
        definition: '',
        examples: '',
        imageFile: null,
        audioFile: null,
        wordSubmitting: false,
        wordSuccess: 'Word saved successfully!'
      });
    } catch (err) {
      this.setState({
        wordError: err.message || 'Failed to add word.',
        wordSubmitting: false
      });
    }
  }

  async handleExpressionSubmit(event) {
    event.preventDefault();
    const expression = this.state.expression.trim();
    const meaning = this.state.meaning.trim();
    const examples = this.state.expressionExamples.trim();
    const createdBy =
      localStorage.getItem('currentUserName') ||
      this.props.currentUserName ||
      '';

    if (!expression || !meaning) {
      this.setState({
        expressionError: 'Expression and meaning are required.'
      });
      return;
    }

    if (!createdBy) {
      this.setState({
        expressionError:
          'No user name found. Please refresh and set your name again.'
      });
      return;
    }

    this.setState({ expressionSubmitting: true, expressionError: null });

    try {
      await createExpression({
        expression,
        meaning,
        examples: examples || null,
        created_by: createdBy,
        audioFile: this.state.expressionAudioFile
      });

      this.setState({
        expression: '',
        meaning: '',
        expressionExamples: '',
        expressionAudioFile: null,
        expressionSubmitting: false,
        expressionSuccess: 'Expression saved successfully!'
      });
    } catch (err) {
      this.setState({
        expressionError: err.message || 'Failed to add expression.',
        expressionSubmitting: false
      });
    }
  }

  render() {
    const isWord = this.state.mode === 'word';
    return (
      <div className="card-panel">
        <div className="page-header">
          <h2 className="page-title">Add a new entry</h2>
          <div className="mini-tabs" role="tablist" aria-label="Entry types">
            <button
              type="button"
              className={`mini-tab ${isWord ? 'active' : ''}`}
              role="tab"
              aria-selected={isWord}
              onClick={() => this.handleTabChange('word')}
            >
              Word
            </button>
            <button
              type="button"
              className={`mini-tab ${!isWord ? 'active' : ''}`}
              role="tab"
              aria-selected={!isWord}
              onClick={() => this.handleTabChange('expression')}
            >
              Expression
            </button>
          </div>
        </div>

        {isWord ? (
          <form onSubmit={this.handleWordSubmit} className="form-grid">
            <div>
              <label>
                Term (required)
                <input
                  type="text"
                  name="term"
                  value={this.state.term}
                  onChange={this.handleWordChange}
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
                  onChange={this.handleWordChange}
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
                  onChange={this.handleWordChange}
                />
              </label>
            </div>
            <div>
              <label>
                Image (optional)
                <input
                  type="file"
                  name="imageFile"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={this.handleWordFileChange}
                />
              </label>
            </div>
            <div>
              <label>Pronunciation audio (optional)</label>
              <AudioRecorder
                fileName={buildAudioFileName(this.state.term)}
                onRecordingReady={this.handleWordRecordingReady}
                helperText="Tip: record a quick pronunciation right here."
              />
            </div>
            {this.state.wordError && (
              <div className="status-text">{this.state.wordError}</div>
            )}
            {this.state.wordSuccess && (
              <div className="success-text">{this.state.wordSuccess}</div>
            )}
            <button
              className="primary-btn"
              type="submit"
              disabled={this.state.wordSubmitting}
            >
              {this.state.wordSubmitting ? 'Saving...' : 'Save word'}
            </button>
          </form>
        ) : (
          <form onSubmit={this.handleExpressionSubmit} className="form-grid">
            <div>
              <label>
                Expression (required)
                <input
                  type="text"
                  name="expression"
                  value={this.state.expression}
                  onChange={this.handleExpressionChange}
                />
              </label>
            </div>
            <div>
              <label>
                Meaning (required)
                <textarea
                  name="meaning"
                  rows="3"
                  value={this.state.meaning}
                  onChange={this.handleExpressionChange}
                />
              </label>
            </div>
            <div>
              <label>
                Examples (optional)
                <textarea
                  name="expressionExamples"
                  rows="2"
                  value={this.state.expressionExamples}
                  onChange={this.handleExpressionChange}
                />
              </label>
            </div>
            <div>
              <label>Pronunciation audio (optional)</label>
              <AudioRecorder
                fileName={buildAudioFileName(this.state.expression)}
                onRecordingReady={this.handleExpressionRecordingReady}
                helperText="Record the expression pronunciation."
              />
            </div>
            {this.state.expressionError && (
              <div className="status-text">{this.state.expressionError}</div>
            )}
            {this.state.expressionSuccess && (
              <div className="success-text">
                {this.state.expressionSuccess}
              </div>
            )}
            <button
              className="primary-btn"
              type="submit"
              disabled={this.state.expressionSubmitting}
            >
              {this.state.expressionSubmitting ? 'Saving...' : 'Save expression'}
            </button>
          </form>
        )}
      </div>
    );
  }
}

export default AddWordPage;

