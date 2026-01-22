import React, { Component } from 'react';
import { getMediaUrl, updateWord } from './api';
import AudioRecorder from './AudioRecorder';

const buildAudioFileName = (term) => {
  const base = (term || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return `${base || 'word'}_sound.mp3`;
};

class WordDetailModal extends Component {
  constructor(props) {
    super(props);
    this.state = this.buildStateFromWord(props.word);

    this.handleChange = this.handleChange.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleRemoveToggle = this.handleRemoveToggle.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRecordingReady = this.handleRecordingReady.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.word &&
      (!prevProps.word || prevProps.word.id !== this.props.word.id)
    ) {
      this.setState(this.buildStateFromWord(this.props.word));
    }
  }

  buildStateFromWord(word) {
    return {
      term: word?.term || '',
      definition: word?.definition || '',
      examples: word?.examples || '',
      imageFile: null,
      audioFile: null,
      removeImage: false,
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

  handleFileChange(event) {
    const { name, files } = event.target;
    const file = files && files[0] ? files[0] : null;
    if (name === 'imageFile') {
      this.setState({ imageFile: file, removeImage: false, error: null });
    }
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
    const { word, onUpdated } = this.props;
    if (!word) {
      return;
    }

    const term = this.state.term.trim();
    const definition = this.state.definition.trim();
    const examples = this.state.examples.trim();

    if (!term || !definition) {
      this.setState({ error: 'Term and definition are required.' });
      return;
    }

    this.setState({ saving: true, error: null, success: null });

    try {
      const result = await updateWord(word.id, {
        term,
        definition,
        examples: examples || null,
        imageFile: this.state.imageFile,
        audioFile: this.state.audioFile,
        removeImage: this.state.removeImage,
        removeAudio: this.state.removeAudio
      });
      this.setState({
        saving: false,
        success: 'Word updated!',
        imageFile: null,
        audioFile: null,
        removeImage: false,
        removeAudio: false
      });
      if (onUpdated) {
        onUpdated(result.word);
      }
    } catch (err) {
      this.setState({
        saving: false,
        error: err.message || 'Failed to update word.'
      });
    }
  }

  renderMedia(word) {
    return (
      <div className="word-detail-media">
        {word.hasImage && (
          <div className="word-detail-media-block">
            <div className="word-detail-label">Image</div>
            <img
              className="word-detail-image"
              src={getMediaUrl(word.imageUrl)}
              alt={`${word.term} illustration`}
            />
          </div>
        )}
        {word.hasAudio && (
          <div className="word-detail-media-block">
            <div className="word-detail-label">Pronunciation</div>
            <audio
              className="word-detail-audio"
              controls
              src={getMediaUrl(word.audioUrl)}
            />
          </div>
        )}
      </div>
    );
  }

  render() {
    const { open, onClose, word, canEdit } = this.props;

    if (!open || !word) {
      return null;
    }

    return (
      <div className="word-detail-overlay" role="dialog" aria-modal="true">
        <div className="word-detail-card">
          <button
            type="button"
            className="word-detail-close"
            onClick={onClose}
            aria-label="Close word details"
          >
            X
          </button>
          <h2 className="page-title">{word.term}</h2>
          {this.renderMedia(word)}
          {!canEdit && (
            <div className="word-detail-body">
              <p>
                <strong>Definition:</strong> {word.definition}
              </p>
              {word.examples && (
                <p>
                  <strong>Examples:</strong> {word.examples}
                </p>
              )}
              <p className="word-meta">
                Added by <strong>{word.created_by}</strong> on{' '}
                {new Date(word.created_at).toLocaleString()}
              </p>
            </div>
          )}
          {canEdit && (
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
              <div className="word-detail-upload">
                <label>
                  Replace image (optional)
                  <input
                    type="file"
                    name="imageFile"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={this.handleFileChange}
                  />
                </label>
                {word.hasImage && (
                  <label className="word-detail-checkbox">
                    <input
                      type="checkbox"
                      name="removeImage"
                      checked={this.state.removeImage}
                      onChange={this.handleRemoveToggle}
                    />
                    Remove current image
                  </label>
                )}
              </div>
              <div className="word-detail-upload">
                <label>
                  Replace audio (record)
                </label>
                <AudioRecorder
                  fileName={buildAudioFileName(this.state.term)}
                  onRecordingReady={this.handleRecordingReady}
                  helperText="Record a fresh pronunciation if needed."
                />
                {word.hasAudio && (
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

export default WordDetailModal;
