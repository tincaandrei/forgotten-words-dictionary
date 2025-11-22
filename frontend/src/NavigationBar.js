import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

class NavigationBar extends Component {
  render() {
    const { currentUserName, theme, onToggleTheme } = this.props;
    const themeLabel = theme === 'dark' ? 'Light mode' : 'Dark mode';

    return (
      <header className="dictionary-header">
        <div className="dictionary-brand">Blandiana Dictionary</div>
        <nav className="dictionary-nav">
          <NavLink
            to="/browse"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Browse
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Search
          </NavLink>
          <NavLink
            to="/add"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Add new word
          </NavLink>
        </nav>
        <div className="nav-right">
          {onToggleTheme && (
            <button
              type="button"
              className="nav-theme-toggle"
              onClick={onToggleTheme}
            >
              {themeLabel}
            </button>
          )}
          {currentUserName && (
            <div className="user-pill">Hello, {currentUserName}</div>
          )}
        </div>
      </header>
    );
  }
}

export default NavigationBar;
