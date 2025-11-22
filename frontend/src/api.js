const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

export function checkAccess(accessCode) {
  return fetch(`${API_BASE}/api/check-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accessCode })
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const message = data.error || 'Access denied';
      throw new Error(message);
    }
    return data;
  });
}

export function getWords() {
  return fetch(`${API_BASE}/api/words`).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch words');
    }
    return res.json();
  });
}

export function createWord(word) {
  return fetch(`${API_BASE}/api/words`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(word)
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const message = data.error || 'Failed to create word';
      throw new Error(message);
    }
    return data;
  });
}

