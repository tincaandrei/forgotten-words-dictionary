import React, { Component } from "react";
import { NavLink } from "react-router-dom";

class NavigationBar extends Component {
  state = {
    drawerOpen: false,
  };

  toggleDrawer = () => {
    this.setState((prev) => ({ drawerOpen: !prev.drawerOpen }));
  };

  closeDrawer = () => {
    this.setState({ drawerOpen: false });
  };

  handleNavClick = () => {
    this.closeDrawer();
  };

  handleToggleTheme = () => {
    const { onToggleTheme } = this.props;
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  render() {
    const { currentUserName, theme, onToggleTheme } = this.props;
    const { drawerOpen } = this.state;
    const themeStatusLabel = theme === "dark" ? "On" : "Off";

    return (
      <>
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            aria-label="Toggle navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="dictionary-drawer"
            onClick={this.toggleDrawer}
          >
            <span className={`menu-icon ${drawerOpen ? "open" : ""}`} />
          </button>
          <div className="brand-title">Blandiana Dictionary</div>
        </header>

        <div
          id="dictionary-drawer"
          className={`nav-drawer ${drawerOpen ? "open" : ""}`}
          role="navigation"
        >
          <button
            type="button"
            className="drawer-close"
            aria-label="Close navigation menu"
            onClick={this.closeDrawer}
          >
            X
          </button>
          <div className="drawer-title">Blandiana Dictionary</div>
          <nav className="drawer-nav">
            {currentUserName && (
              <div className="drawer-user">Hello, {currentUserName}</div>
            )}
            <NavLink
              to="/browse"
              className={({ isActive }) =>
                isActive ? "drawer-link active" : "drawer-link"
              }
              onClick={this.handleNavClick}
            >
              Browse
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                isActive ? "drawer-link active" : "drawer-link"
              }
              onClick={this.handleNavClick}
            >
              Search
            </NavLink>
            <NavLink
              to="/add"
              className={({ isActive }) =>
                isActive ? "drawer-link active" : "drawer-link"
              }
              onClick={this.handleNavClick}
            >
              Add new word
            </NavLink>
          </nav>

          <div className="drawer-section">
            {onToggleTheme && (
              <button
                type="button"
                className="drawer-theme"
                onClick={this.handleToggleTheme}
              >
                <span>Dark mode</span>
                <span className="status-label">
                  <span className="status-dot" aria-hidden="true" />
                  {themeStatusLabel}
                </span>
              </button>
            )}
          </div>
        </div>

        <div
          className={`drawer-backdrop ${drawerOpen ? "open" : ""}`}
          onClick={this.closeDrawer}
        />
      </>
    );
  }
}

export default NavigationBar;
