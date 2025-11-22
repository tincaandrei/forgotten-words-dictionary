import React, { Component } from 'react';
import { getWords } from './api';

class BrowsePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      words: [],
      loading: false,
      error: null
    };

    this.fetchWords = this.fetchWords.bind(this);
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
          <li key={word.id} className="word-item">
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
    return (
      <div className="card-panel">
        <h2 className="page-title">Browse dictionary</h2>
        {this.state.error && (
          <div className="status-text">{this.state.error}</div>
        )}
        {this.renderList()}
      </div>
    );
  }
}

export default BrowsePage;
