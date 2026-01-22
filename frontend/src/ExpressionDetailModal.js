import React, { Component } from 'react';
import { getMediaUrl, updateExpression } from './api';
import AudioRecorder from './AudioRecorder';

const buildAudioFileName = (expression) => {
  const base = (expression || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return `${base || 'expression'}_sound.mp3`;
};

class ExpressionDetailModal extends Component {
  constructor(props) {
    super(props);
    this.state = this.buildStateFromExpression(props.expression);

    this.handleChange = this.handleChange.bind(this);
    this.handleRemoveToggle = this.handleRemoveToggle.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRecordingReady = this.handleRecordingReady.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.expression &&
      (!prevProps.expression ||
        prevProps.expression.id !== this.props.expression.id)
    ) {
      this.setState(this.buildStateFromExpression(this.props.expression));
    }
  }

  buildStateFromExpression(expression) {
    return {
      expression: expression?.expression || '',
      meaning: expression?.meaning || '',
      examples: expression?.examples || '',
      audioFile: null,
      removeAudio: false,
      saving: false,
      error: null,
      success: null
    };
  }

  handleChange(event) {
    const { name, value } = event.target;
    this.setState({ [name]: value, error: null, success: null });
  }

  handleRemoveToggle(event) {
    const { name, checked } = event.target;
    this.setState({ [name]: checked, error: null, success: null });
  }

  handleRecordingReady(file) {
    this.setState({ audioFile: file, removeAudio: false, error: null });
  }

  async handleSubmit(event) {
    event.preventDefault();
    const { expression, onUpdated } = this.props;
    if (!expression) {
      return;
    }

    const trimmedExpression = this.state.expression.trim();
    const trimmedMeaning = this.state.meaning.trim();
    const trimmedExamples = this.state.examples.trim();

    if (!trimmedExpression || !trimmedMeaning) {
      this.setState({ error: 'Expression and meaning are required.' });
      return;
    }

    this.setState({ saving: true, error: null, success: null });

    try {
      const result = await updateExpression(expression.id, {
        expression: trimmedExpression,
        meaning: trimmedMeaning,
        examples: trimmedExamples || null,
        audioFile: this.state.audioFile,
        removeAudio: this.state.removeAudio
      });
      this.setState({
        saving: false,
        success: 'Expression updated!',
        audioFile: null,
        removeAudio: false
      });
      if (onUpdated) {
        onUpdated(result.expression);
      }
    } catch (err) {
      this.setState({
        saving: false,
        error: err.message || 'Failed to update expression.'
      });
    }
  }

  renderMedia(expression) {
    return (
      <div className="word-detail-media">
        {expression.hasAudio && (
          <div className="word-detail-media-block">
            <div className="word-detail-label">Pronunciation</div>
            <audio
              className="word-detail-audio"
              controls
              src={getMediaUrl(expression.audioUrl)}
            />
          </div>
        )}
      </div>
    );
  }

  render() {
    const { open, onClose, expression, canEdit } = this.props;

    if (!open || !expression) {
      return null;
    }

    return (
      <div className="word-detail-overlay" role="dialog" aria-modal="true">
        <div className="word-detail-card">
          <button
            type="button"
            className="word-detail-close"
            onClick={onClose}
            aria-label="Close expression details"
          >
            X
          </button>
          <h2 className="page-title">{expression.expression}</h2>
          {this.renderMedia(expression)}
          {!canEdit && (
            <div className="word-detail-body">
              <p>
                <strong>Meaning:</strong> {expression.meaning}
              </p>
              {expression.examples && (
                <p>
                  <strong>Examples:</strong> {expression.examples}
                </p>
              )}
              <p className="word-meta">
                Added by <strong>{expression.created_by}</strong> on{' '}
                {new Date(expression.created_at).toLocaleString()}
              </p>
            </div>
          )}
          {canEdit && (
            <form onSubmit={this.handleSubmit} className="form-grid">
              <div>
                <label>
                  Expression (required)
                  <input
                    type="text"
                    name="expression"
                    value={this.state.expression}
                    onChange={this.handleChange}
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
              <div className="word-detail-upload">
                <label>
                  Replace audio (record)
                </label>
                <AudioRecorder
                  fileName={buildAudioFileName(this.state.expression)}
                  onRecordingReady={this.handleRecordingReady}
                  helperText="Record the expression pronunciation."
                />
                {expression.hasAudio && (
                  <label className="word-detail-checkbox">
                    <input
                      type="checkbox"
                      name="removeAudio"
                      checked={this.state.removeAudio}
                      onChange={this.handleRemoveToggle}
                    />
                    Remove current audio
                  </label>
                )}
              </div>
              {this.state.error && (
                <div className="status-text">{this.state.error}</div>
              )}
              {this.state.success && (
                <div className="success-text">{this.state.success}</div>
              )}
              <div className="word-detail-actions">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={this.state.saving}
                >
                  {this.state.saving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}

export default ExpressionDetailModal;
