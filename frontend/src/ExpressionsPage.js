import React, { Component } from 'react';
import { getExpression, getExpressions } from './api';
import ExpressionDetailModal from './ExpressionDetailModal';

class ExpressionsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expressions: [],
      loading: false,
      error: null,
      selectedExpression: null,
      detailOpen: false,
      detailError: null
    };

    this.fetchExpressions = this.fetchExpressions.bind(this);
    this.openExpressionDetails = this.openExpressionDetails.bind(this);
    this.closeExpressionDetails = this.closeExpressionDetails.bind(this);
    this.handleExpressionUpdated = this.handleExpressionUpdated.bind(this);
    this.handleExpressionKeyDown = this.handleExpressionKeyDown.bind(this);
  }

  componentDidMount() {
    this.fetchExpressions();
  }

  async fetchExpressions() {
    this.setState({ loading: true, error: null });
    try {
      const expressions = await getExpressions();
      this.setState({ expressions, loading: false });
    } catch (err) {
      this.setState({
        error: err.message || 'Failed to load expressions.',
        loading: false
      });
    }
  }

  async openExpressionDetails(expression) {
    if (!expression) {
      return;
    }

    this.setState({
      selectedExpression: expression,
      detailOpen: true,
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
      detailOpen: false,
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
      selectedExpression: updatedExpression
    }));
  }

  handleExpressionKeyDown(event, expression) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openExpressionDetails(expression);
    }
  }

  renderList() {
    const { expressions, loading } = this.state;

    if (loading) {
      return <div>Loading expressions...</div>;
    }

    if (expressions.length === 0) {
      return <div>No expressions yet. Add the first one!</div>;
    }

    return (
      <ul className="word-list">
        {expressions.map((expression) => (
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
        <h2 className="page-title">Expressions</h2>
        {this.state.error && (
          <div className="status-text">{this.state.error}</div>
        )}
        {this.renderList()}
        {this.state.detailError && (
          <div className="status-text">{this.state.detailError}</div>
        )}
        <ExpressionDetailModal
          open={this.state.detailOpen}
          expression={this.state.selectedExpression}
          canEdit={canEdit}
          onClose={this.closeExpressionDetails}
          onUpdated={this.handleExpressionUpdated}
        />
      </div>
    );
  }
}

export default ExpressionsPage;
