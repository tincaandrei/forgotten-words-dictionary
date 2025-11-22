import React, { Component } from 'react';
import { getWords } from './api';

class SearchPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      words: [],
      query: '',
      filtered: [],
      loading: false,
      error: null
    };

    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.filterWords = this.filterWords.bind(this);
  }

  componentDidMount() {
    this.loadWords();
  }

  async loadWords() {
    this.setState({ loading: true, error: null });
    try {
      const words = await getWords();
      this.setState({
        words,
        filtered: words,
        loading: false
      });
    } catch (err) {
      this.setState({
        loading: false,
        error: err.message || 'Failed to load words.'
      });
    }
  }

  handleQueryChange(event) {
    const value = event.target.value;
    this.setState({ query: value });
    this.filterWords(value);
  }

  filterWords(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      this.setState((prev) => ({ filtered: prev.words }));
      return;
    }

    this.setState((prev) => ({
      filtered: prev.words.filter((word) => {
        const term = word.term || '';
        const definition = word.definition || '';
        return (
          term.toLowerCase().includes(normalized) ||
          definition.toLowerCase().includes(normalized)
        );
      })
    }));
  }

  renderResults() {
    if (this.state.loading) {
      return <div>Searching...</div>;
    }

    if (this.state.filtered.length === 0) {
      return <div>No matches yet.</div>;
    }

    return (
      <ul className="word-list">
        {this.state.filtered.map((word) => (
          <li key={word.id} className="word-item">
            <h3>{word.term}</h3>
            <p>{word.definition}</p>
            {word.examples && <p>{word.examples}</p>}
            <p className="word-meta">
              Added by {word.created_by} on{' '}
              {new Date(word.created_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    return (
      <div className="card-panel">
        <h2 className="page-title">Search words</h2>
        <input
          className="search-input"
          type="text"
          placeholder="Start typing to search..."
          value={this.state.query}
          onChange={this.handleQueryChange}
        />
        {this.state.error && (
          <div className="status-text">{this.state.error}</div>
        )}
        <div style={{ marginTop: '1.5rem' }}>{this.renderResults()}</div>
      </div>
    );
  }
}

export default SearchPage;

