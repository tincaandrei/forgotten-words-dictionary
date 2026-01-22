const API_BASE =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

function withApiBase(path) {
  if (!path) {
    return null;
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_BASE}${path}`;
}

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

export function getWord(id) {
  return fetch(`${API_BASE}/api/words/${id}`).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch word');
    }
    return res.json();
  });
}

export function getExpressions() {
  return fetch(`${API_BASE}/api/expressions`).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch expressions');
    }
    return res.json();
  });
}

export function getExpression(id) {
  return fetch(`${API_BASE}/api/expressions/${id}`).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch expression');
    }
    return res.json();
  });
}

export function createWord(word) {
  const { imageFile, audioFile, ...payload } = word || {};
  const hasFiles = Boolean(imageFile) || Boolean(audioFile);
  const request = hasFiles
    ? {
        method: 'POST',
        body: buildWordFormData({ ...payload, imageFile, audioFile })
      }
    : {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      };

  return fetch(`${API_BASE}/api/words`, request).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const message = data.error || 'Failed to create word';
      throw new Error(message);
    }
    return data;
  });
}

export function createExpression(expression) {
  const { audioFile, ...payload } = expression || {};
  const hasFiles = Boolean(audioFile);
  const request = hasFiles
    ? {
        method: 'POST',
        body: buildExpressionFormData({ ...payload, audioFile })
      }
    : {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      };

  return fetch(`${API_BASE}/api/expressions`, request).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const message = data.error || 'Failed to create expression';
      throw new Error(message);
    }
    return data;
  });
}

export function updateWord(id, word) {
  const { imageFile, audioFile, removeImage, removeAudio, ...payload } =
    word || {};
  const hasFiles = Boolean(imageFile) || Boolean(audioFile);
  const hasRemovals = Boolean(removeImage) || Boolean(removeAudio);
  const request = hasFiles
    ? {
        method: 'PUT',
        body: buildWordFormData({
          ...payload,
          imageFile,
          audioFile,
          removeImage,
          removeAudio
        })
      }
    : {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          removeImage: hasRemovals ? removeImage : undefined,
          removeAudio: hasRemovals ? removeAudio : undefined
        })
      };

  return fetch(`${API_BASE}/api/words/${id}`, request).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const message = data.error || 'Failed to update word';
      throw new Error(message);
    }
    return data;
  });
}

export function updateExpression(id, expression) {
  const { audioFile, removeAudio, ...payload } = expression || {};
  const hasFiles = Boolean(audioFile);
  const hasRemovals = Boolean(removeAudio);
  const request = hasFiles
    ? {
        method: 'PUT',
        body: buildExpressionFormData({
          ...payload,
          audioFile,
          removeAudio
        })
      }
    : {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          removeAudio: hasRemovals ? removeAudio : undefined
        })
      };

  return fetch(`${API_BASE}/api/expressions/${id}`, request).then(
    async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const message = data.error || 'Failed to update expression';
        throw new Error(message);
      }
      return data;
    }
  );
}

function buildWordFormData(word) {
  const formData = new FormData();
  if (word.term !== undefined) {
    formData.append('term', word.term);
  }
  if (word.definition !== undefined) {
    formData.append('definition', word.definition);
  }
  if (word.examples !== undefined) {
    formData.append('examples', word.examples || '');
  }
  if (word.created_by !== undefined) {
    formData.append('created_by', word.created_by);
  }
  if (word.removeImage) {
    formData.append('removeImage', 'true');
  }
  if (word.removeAudio) {
    formData.append('removeAudio', 'true');
  }
  if (word.imageFile) {
    formData.append('image', word.imageFile);
  }
  if (word.audioFile) {
    formData.append('audio', word.audioFile);
  }
  return formData;
}

function buildExpressionFormData(expression) {
  const formData = new FormData();
  if (expression.expression !== undefined) {
    formData.append('expression', expression.expression);
  }
  if (expression.meaning !== undefined) {
    formData.append('meaning', expression.meaning);
  }
  if (expression.examples !== undefined) {
    formData.append('examples', expression.examples || '');
  }
  if (expression.created_by !== undefined) {
    formData.append('created_by', expression.created_by);
  }
  if (expression.removeAudio) {
    formData.append('removeAudio', 'true');
  }
  if (expression.audioFile) {
    formData.append('audio', expression.audioFile);
  }
  return formData;
}

export function getMediaUrl(path) {
  return withApiBase(path);
}

