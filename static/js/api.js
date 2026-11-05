// Connects MindJoy's pages to its API. Chat history lives only in this page's
// memory, so it is gone when the page closes or the chat is cleared.
(function () {
  var API_BASE = 'https://mindjoy-api.lingyahuang.com';
  var MAX_HISTORY = 20;
  var realFetch = window.fetch.bind(window);
  var history = [];

  var unavailable = {
    zh: 'AI 对话暂时不可用，请稍后再试。\n\n如果你现在很难受，或者担心自己或他人的安全，请拨打：\n全国统一心理援助热线 12356\n遇到紧急危险请拨打 110 或 120。',
    en: "The AI chat isn't available right now. Please try again later.\n\nIf you're struggling, or worried about your safety or someone else's, please call your local emergency number or a crisis line. In mainland China, call 12356, or 110 / 120 in an emergency."
  };

  function json(body) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function sendChat(options) {
    var body = {};
    try {
      body = JSON.parse(options.body);
    } catch (e) {}
    var lang = body.lang === 'en' ? 'en' : 'zh';
    return realFetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: body.message, lang: lang, history: history })
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      if (data.status === 'success') {
        history.push({ role: 'user', content: body.message }, { role: 'assistant', content: data.response });
        history = history.slice(-MAX_HISTORY);
      }
      return json(data);
    }).catch(function () {
      return json({ status: 'error', response: unavailable[lang] });
    });
  }

  window.fetch = function (url, options) {
    var path = typeof url === 'string' ? url : url.url;
    if (path.indexOf('/api/') !== 0) return realFetch(url, options);
    if (path === '/api/chat') return sendChat(options);
    if (path === '/api/chat/clear') {
      history = [];
      return Promise.resolve(json({ status: 'success' }));
    }
    if (path === '/api/chat/feedback') return Promise.resolve(json({ status: 'success' }));
    return realFetch(API_BASE + path, options).catch(function () {
      return json({ success: false });
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent =
      '.message-feedback{display:none}' +
      '#ai-response-text,#aiAnalysisContent{white-space:pre-line}';
    document.head.appendChild(style);
  });
})();
