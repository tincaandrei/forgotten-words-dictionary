import React, { Component } from 'react';
import { getWord, getWords } from './api';
import WordDetailModal from './WordDetailModal';

class BrowsePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      words: [],
      loading: false,
      error: null,
      selectedWord: null,
      detailOpen: false,
      detailError: null
    };

    this.fetchWords = this.fetchWords.bind(this);
    this.openWordDetails = this.openWordDetails.bind(this);
    this.closeWordDetails = this.closeWordDetails.bind(this);
    this.handleWordUpdated = this.handleWordUpdated.bind(this);
    this.handleWordKeyDown = this.handleWordKeyDown.bind(this);
  }

  componentDidMount() {
    this.fetchWords();
  }

  async fetchWords() {
    this.setState({ loading: true, error: null });
    try {
      const words = await getWords();
      this.setState({ words, loading: false });
    } catch (err) {
      this.setState({
        error: err.message || 'Failed to load words.',
        loading: false
      });
    }
  }

  async openWordDetails(word) {
    if (!word) {
      return;
    }

    this.setState({
      selectedWord: word,
      detailOpen: true,
      detailError: null
    });

    try {
      const fullWord = await getWord(word.id);
      this.setState({ selectedWord: fullWord });
    } catch (err) {
      this.setState({
        detailError: err.message || 'Failed to load word details.'
      });
    }
  }

  closeWordDetails() {
    this.setState({ detailOpen: false, selectedWord: null, detailError: null });
  }

  handleWordUpdated(updatedWord) {
    if (!updatedWord) {
      return;
    }
    this.setState((prev) => ({
      words: prev.words.map((word) =>
        word.id === updatedWord.id ? updatedWord : word
      ),
      selectedWord: updatedWord
    }));
  }

  handleWordKeyDown(event, word) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openWordDetails(word);
    }
  }

  renderList() {
    const { words, loading } = this.state;

    if (loading) {
      return <div>Loading words...</div>;
    }

    if (words.length === 0) {
      return <div>No words yet. Be the first to add one!</div>;
    }

    return (
      <ul className="word-list">
        {words.map((word) => (
          <li
            key={word.id}
            className="word-item is-clickable"
            onClick={() => this.openWordDetails(word)}
            onKeyDown={(event) => this.handleWordKeyDown(event, word)}
            role="button"
            tabIndex={0}
          >
            <h3>{word.term}</h3>
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
          </li>
        ))}
      </ul>
    );
  }

  render() {
    const canEdit = Boolean(
      this.props.currentUserName || localStorage.getItem('currentUserName')
    );
    return (
      <div className="card-panel">
        <h2 className="page-title">Browse dictionary</h2>
        {this.state.error && (
          <div className="status-text">{this.state.error}</div>
        )}
        {this.renderList()}
        {this.state.detailError && (
          <div className="status-text">{this.state.detailError}</div>
        )}
        <WordDetailModal
          open={this.state.detailOpen}
          word={this.state.selectedWord}
          canEdit={canEdit}
          onClose={this.closeWordDetails}
          onUpdated={this.handleWordUpdated}
        />
      </div>
    );
  }
}

export default BrowsePage;
