import React, { Component } from 'react';
import {
  getExpression,
  getExpressions,
  getWord,
  getWords
} from './api';
import WordDetailModal from './WordDetailModal';
import ExpressionDetailModal from './ExpressionDetailModal';

class SearchPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'word',
      words: [],
      expressions: [],
      query: '',
      expressionQuery: '',
      filtered: [],
      filteredExpressions: [],
      loadingWords: false,
      loadingExpressions: false,
      errorWords: null,
      errorExpressions: null,
      selectedWord: null,
      selectedExpression: null,
      detailOpen: false,
      expressionDetailOpen: false,
      detailError: null
    };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleExpressionQueryChange =
      this.handleExpressionQueryChange.bind(this);
    this.filterWords = this.filterWords.bind(this);
    this.filterExpressions = this.filterExpressions.bind(this);
    this.openWordDetails = this.openWordDetails.bind(this);
    this.closeWordDetails = this.closeWordDetails.bind(this);
    this.handleWordUpdated = this.handleWordUpdated.bind(this);
    this.handleWordKeyDown = this.handleWordKeyDown.bind(this);
    this.openExpressionDetails = this.openExpressionDetails.bind(this);
    this.closeExpressionDetails = this.closeExpressionDetails.bind(this);
    this.handleExpressionUpdated = this.handleExpressionUpdated.bind(this);
    this.handleExpressionKeyDown = this.handleExpressionKeyDown.bind(this);
  }

  componentDidMount() {
    this.loadWords();
    this.loadExpressions();
  }

  handleTabChange(mode) {
    this.setState({ mode });
  }

  async loadWords() {
    this.setState({ loadingWords: true, errorWords: null });
    try {
      const words = await getWords();
      this.setState({
        words,
        filtered: words,
        loadingWords: false
      });
    } catch (err) {
      this.setState({
        loadingWords: false,
        errorWords: err.message || 'Failed to load words.'
      });
    }
  }

  async loadExpressions() {
    this.setState({ loadingExpressions: true, errorExpressions: null });
    try {
      const expressions = await getExpressions();
      this.setState({
        expressions,
        filteredExpressions: expressions,
        loadingExpressions: false
      });
    } catch (err) {
      this.setState({
        loadingExpressions: false,
        errorExpressions: err.message || 'Failed to load expressions.'
      });
    }
  }

  handleQueryChange(event) {
    const value = event.target.value;
    this.setState({ query: value });
    this.filterWords(value);
  }

  handleExpressionQueryChange(event) {
    const value = event.target.value;
    this.setState({ expressionQuery: value });
    this.filterExpressions(value);
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

  filterExpressions(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      this.setState((prev) => ({
        filteredExpressions: prev.expressions
      }));
      return;
    }

    this.setState((prev) => ({
      filteredExpressions: prev.expressions.filter((expression) => {
        const text = expression.expression || '';
        const meaning = expression.meaning || '';
        return (
          text.toLowerCase().includes(normalized) ||
          meaning.toLowerCase().includes(normalized)
        );
      })
    }));
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
      filtered: prev.filtered.map((word) =>
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

  async openExpressionDetails(expression) {
    if (!expression) {
      return;
    }

    this.setState({
      selectedExpression: expression,
      expressionDetailOpen: true,
      detailError: null
    });

    try {
      const fullExpression = await getExpression(expression.id);
      this.setState({ selectedExpression: fullExpression });
    } catch (err) {
      this.setState({
        detailError: err.message || 'Failed to load expression details.'
      });
    }
  }

  closeExpressionDetails() {
    this.setState({
      expressionDetailOpen: false,
      selectedExpression: null,
      detailError: null
    });
  }

  handleExpressionUpdated(updatedExpression) {
    if (!updatedExpression) {
      return;
    }
    this.setState((prev) => ({
      expressions: prev.expressions.map((item) =>
        item.id === updatedExpression.id ? updatedExpression : item
      ),
      filteredExpressions: prev.filteredExpressions.map((item) =>
        item.id === updatedExpression.id ? updatedExpression : item
      ),
      selectedExpression: updatedExpression
    }));
  }

  handleExpressionKeyDown(event, expression) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openExpressionDetails(expression);
    }
  }

  renderWordResults() {
    if (this.state.loadingWords) {
      return <div>Searching...</div>;
    }

    if (this.state.filtered.length === 0) {
      return <div>No matches yet.</div>;
    }

    return (
      <ul className="word-list">
        {this.state.filtered.map((word) => (
          <li
            key={word.id}
            className="word-item is-clickable"
            onClick={() => this.openWordDetails(word)}
            onKeyDown={(event) => this.handleWordKeyDown(event, word)}
            role="button"
            tabIndex={0}
          >
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

  renderExpressionResults() {
    if (this.state.loadingExpressions) {
      return <div>Searching...</div>;
    }

    if (this.state.filteredExpressions.length === 0) {
      return <div>No matches yet.</div>;
    }

    return (
      <ul className="word-list">
        {this.state.filteredExpressions.map((expression) => (
          <li
            key={expression.id}
            className="word-item is-clickable"
            onClick={() => this.openExpressionDetails(expression)}
            onKeyDown={(event) =>
              this.handleExpressionKeyDown(event, expression)
            }
            role="button"
            tabIndex={0}
          >
            <h3>{expression.expression}</h3>
            <p>{expression.meaning}</p>
            {expression.examples && <p>{expression.examples}</p>}
            <p className="word-meta">
              Added by {expression.created_by} on{' '}
              {new Date(expression.created_at).toLocaleDateString()}
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
    const isWord = this.state.mode === 'word';
    return (
      <div className="card-panel">
        <h2 className="page-title">Search</h2>
        <div className="mini-tabs" role="tablist" aria-label="Search modes">
          <button
            type="button"
            className={`mini-tab ${isWord ? 'active' : ''}`}
            role="tab"
            aria-selected={isWord}
            onClick={() => this.handleTabChange('word')}
          >
            Words
          </button>
          <button
            type="button"
            className={`mini-tab ${!isWord ? 'active' : ''}`}
            role="tab"
            aria-selected={!isWord}
            onClick={() => this.handleTabChange('expression')}
          >
            Expressions
          </button>
        </div>
        {isWord ? (
          <>
            {this.state.errorWords && (
              <div className="status-text">{this.state.errorWords}</div>
            )}
            <input
              className="search-input"
              type="text"
              placeholder="Start typing to search words..."
              value={this.state.query}
              onChange={this.handleQueryChange}
            />
            <div style={{ marginTop: '1.5rem' }}>
              {this.renderWordResults()}
            </div>
          </>
        ) : (
          <>
            {this.state.errorExpressions && (
              <div className="status-text">{this.state.errorExpressions}</div>
            )}
            <input
              className="search-input"
              type="text"
              placeholder="Start typing to search expressions..."
              value={this.state.expressionQuery}
              onChange={this.handleExpressionQueryChange}
            />
            <div style={{ marginTop: '1.5rem' }}>
              {this.renderExpressionResults()}
            </div>
          </>
        )}
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
        <ExpressionDetailModal
          open={this.state.expressionDetailOpen}
          expression={this.state.selectedExpression}
          canEdit={canEdit}
          onClose={this.closeExpressionDetails}
          onUpdated={this.handleExpressionUpdated}
        />
      </div>
    );
  }
}

export default SearchPage;
