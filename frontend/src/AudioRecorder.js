import React, { Component } from 'react';

const PREFERRED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg'];

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }
  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }
  return (
    PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || null
  );
}

class AudioRecorder extends Component {
  state = {
    isRecording: false,
    error: null,
    audioUrl: null,
    mimeType: null
  };

  componentWillUnmount() {
    this.stopStream();
    if (this.state.audioUrl) {
      URL.revokeObjectURL(this.state.audioUrl);
    }
  }

  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  handleStart = async () => {
    if (this.state.isRecording) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.setState({
        error: 'Audio recording is not supported in this browser.'
      });
      return;
    }

    const selectedType = pickMimeType();
    if (!selectedType) {
      this.setState({
        error: 'Audio recording is not supported in this browser.'
      });
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(
        this.stream,
        selectedType ? { mimeType: selectedType } : undefined
      );
      this.chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: selectedType });
        if (this.state.audioUrl) {
          URL.revokeObjectURL(this.state.audioUrl);
        }
        const audioUrl = URL.createObjectURL(blob);
        const fileName =
          this.props.fileName || 'recording_sound.mp3';
        const file = new File([blob], fileName, {
          type: blob.type || selectedType || 'audio/mpeg'
        });
        this.setState({
          isRecording: false,
          audioUrl,
          mimeType: blob.type || selectedType || null,
          error: null
        });
        if (this.props.onRecordingReady) {
          this.props.onRecordingReady(file);
        }
        this.stopStream();
      };

      this.recorder = recorder;
      recorder.start();
      this.setState({ isRecording: true, error: null });
    } catch (err) {
      this.setState({
        error: err.message || 'Could not start recording.'
      });
      this.stopStream();
    }
  };

  handleStop = () => {
    if (this.recorder && this.state.isRecording) {
      this.recorder.stop();
    }
  };

  render() {
    const { disabled } = this.props;
    const { isRecording, error, audioUrl, mimeType } = this.state;

    return (
      <div className="audio-recorder">
        <div className="audio-recorder-actions">
          <button
            type="button"
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onClick={this.handleStart}
            disabled={disabled || isRecording}
          >
            {isRecording ? 'Recording...' : 'Record audio'}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={this.handleStop}
            disabled={disabled || !isRecording}
          >
            Stop
          </button>
        </div>
        {audioUrl && (
          <audio className="word-detail-audio" controls src={audioUrl} />
        )}
        {mimeType && mimeType !== 'audio/mpeg' && (
          <div className="audio-recorder-note">
            Recording format: {mimeType}
          </div>
        )}
        {error && <div className="status-text">{error}</div>}
        {this.props.helperText && (
          <div className="audio-recorder-note">{this.props.helperText}</div>
        )}
      </div>
    );
  }
}

export default AudioRecorder;
