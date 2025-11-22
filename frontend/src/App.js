import React, { Component } from 'react';
import AccessCodeScreen from './AccessCodeScreen';
import NamePickerScreen from './NamePickerScreen';
import DictionaryScreen from './DictionaryScreen';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasAccess: false,
      currentUserName: null,
      initialized: false,
      theme: 'light'
    };

    this.handleAccessGranted = this.handleAccessGranted.bind(this);
    this.handleNameSelected = this.handleNameSelected.bind(this);
    this.handleThemeToggle = this.handleThemeToggle.bind(this);
    this.applyTheme = this.applyTheme.bind(this);
  }

  componentDidMount() {
    const hasAccess = localStorage.getItem('hasAccess') === 'true';
    const currentUserName = localStorage.getItem('currentUserName') || null;

    const nameSetAtRaw = localStorage.getItem('currentUserNameSetAt');
    const nameSetAt = nameSetAtRaw ? parseInt(nameSetAtRaw, 10) : null;

    // 2 hours in milliseconds
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    const storedTheme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    this.applyTheme(storedTheme);

    let effectiveUserName = currentUserName;

    if (currentUserName && nameSetAt && !Number.isNaN(nameSetAt)) {
      const age = Date.now() - nameSetAt;
      if (age > TWO_HOURS_MS) {
        // Expired: remove stored name so we can ask again.
        localStorage.removeItem('currentUserName');
        localStorage.removeItem('currentUserNameSetAt');
        effectiveUserName = null;
      }
    }

    this.setState({
      hasAccess: hasAccess,
      currentUserName: effectiveUserName,
      initialized: true,
      theme: storedTheme
    });
  }

  applyTheme(theme) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  }

  handleAccessGranted() {
    this.setState({ hasAccess: true });
  }

  handleNameSelected(name) {
    this.setState({ currentUserName: name });
  }

  handleThemeToggle() {
    this.setState((prevState) => {
      const nextTheme = prevState.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(nextTheme);
      return { theme: nextTheme };
    });
  }

  render() {
    if (!this.state.initialized) {
      return <div style={{ padding: '2rem' }}>Loading...</div>;
    }

    const { hasAccess, currentUserName, theme } = this.state;

    if (!hasAccess) {
      return (
        <AccessCodeScreen
          onAccessGranted={this.handleAccessGranted}
          onNameSelected={this.handleNameSelected}
          theme={theme}
          onToggleTheme={this.handleThemeToggle}
        />
      );
    }

    if (!currentUserName) {
      return <NamePickerScreen onNameSelected={this.handleNameSelected} />;
    }

    return (
      <DictionaryScreen
        currentUserName={currentUserName}
        theme={theme}
        onToggleTheme={this.handleThemeToggle}
      />
    );
  }
}

export default App;
