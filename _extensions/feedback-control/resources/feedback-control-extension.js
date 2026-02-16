'use strict';
window.feedbackControlExtensionInit = (options) => {
  const diplodocDataRef = window.__DATA__;
  if (diplodocDataRef.data.leading) {
    return;
  }
  options = Object.assign({}, { endpoint: void 0 }, options);
  const route = window.location.pathname;
  const storageKey = `feedback:${route}`;

  const sendLocalState = (data) => {
    if (data.type === 'indeterminate') {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  };
  const getLocalState = () => {
    const data = window.localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  };
  const localState = getLocalState();
  if (
    (localState === null || localState === void 0
      ? void 0
      : localState.type) === 'like'
  ) {
    diplodocDataRef.data.isLiked = true;
  }
  if (
    (localState === null || localState === void 0
      ? void 0
      : localState.type) === 'dislike'
  ) {
    diplodocDataRef.data.isDisliked = true;
  }
  diplodocDataRef.data.onSendFeedback = (data) => {
    const feedbackEvent = new CustomEvent('feedback', {
      detail: data,
    });
    document.dispatchEvent(feedbackEvent);

    sendLocalState(data);
  };
};
