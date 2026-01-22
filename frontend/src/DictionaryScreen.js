import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BrowsePage from './BrowsePage';
import SearchPage from './SearchPage';
import AddWordPage from './AddWordPage';
import ExpressionsPage from './ExpressionsPage';
import NavigationBar from './NavigationBar';
import './styles/DictionaryLayout.css';

class DictionaryScreen extends Component {
  render() {
    const { currentUserName, theme, onToggleTheme } = this.props;

    return (
      <BrowserRouter>
        <div className="dictionary-app">
          <NavigationBar
            currentUserName={currentUserName}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
          <main className="dictionary-main">
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/browse" replace />}
              />
              <Route
                path="/browse"
                element={<BrowsePage currentUserName={currentUserName} />}
              />
              <Route
                path="/search"
                element={<SearchPage currentUserName={currentUserName} />}
              />
              <Route
                path="/add"
                element={<AddWordPage currentUserName={currentUserName} />}
              />
              <Route
                path="/expressions"
                element={<ExpressionsPage currentUserName={currentUserName} />}
              />
              <Route
                path="*"
                element={<Navigate to="/browse" replace />}
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    );
  }
}

export default DictionaryScreen;
