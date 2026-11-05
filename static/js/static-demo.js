// Static build of MindJoy for GitHub Pages. There is no backend here, so nothing
// typed into the site may leave the browser: API calls are answered locally and
// the page scripts use their built-in fallback text.
(function () {
  var realFetch = window.fetch.bind(window);

  function currentLang() {
    try {
      return localStorage.getItem('lang') || 'zh';
    } catch (e) {
      return 'zh';
    }
  }

  var chatNotice = {
    zh: '这是 MindJoy 的静态演示版，AI 对话没有连接，所以我无法回复你说的内容。你输入的文字不会被发送或保存。\n\n' +
        '如果你现在很难受，或者担心自己或他人的安全，请拨打：\n' +
        '全国心理援助热线 400-161-9995\n' +
        '北京心理危机中心 010-82951332\n' +
        '生命热线 400-821-1215\n' +
        '遇到紧急危险请拨打 110 或 120。',
    en: "This is a static demo of MindJoy. The AI chat isn't connected, so I can't reply to what you wrote. Your message isn't sent or saved.\n\n" +
        "If you're struggling right now, or worried about your safety or someone else's, please call your local emergency number or a crisis line. In mainland China:\n" +
        '400-161-9995 (national psychological support line)\n' +
        '010-82951332 (Beijing crisis center)\n' +
        '400-821-1215 (Lifeline)'
  };

  var bannerText = {
    zh: '静态演示版：心理测试、情绪树洞和日记可以使用，内容只保存在你的浏览器里。AI 对话未连接。',
    en: "Static demo: the test, tree hole and diary work, and your entries stay in this browser. AI chat isn't connected."
  };

  function json(body) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function requestLang(options) {
    try {
      return JSON.parse(options.body).lang === 'en' ? 'en' : 'zh';
    } catch (e) {
      return currentLang();
    }
  }

  window.fetch = function (url, options) {
    var path = typeof url === 'string' ? url : url.url;
    if (path.indexOf('/api/chat/') !== -1) {
      return Promise.resolve(json({ status: 'success' }));
    }
    if (path.indexOf('/api/chat') !== -1) {
      return Promise.resolve(json({ status: 'offline', response: chatNotice[requestLang(options)] }));
    }
    if (path.indexOf('/api/') !== -1) {
      return Promise.resolve(json({ success: false }));
    }
    return realFetch(url, options);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent =
      '.static-demo-note{background:var(--bg-warm);color:var(--text-medium);font-size:.875rem;line-height:1.5;padding:.6rem 1rem;text-align:center}' +
      '.message-feedback{display:none}' +
      '.message-text,.message-content{white-space:pre-line}';
    document.head.appendChild(style);

    var main = document.querySelector('.main-content');
    if (!main) return;
    var note = document.createElement('div');
    note.className = 'static-demo-note';
    note.setAttribute('data-zh', bannerText.zh);
    note.setAttribute('data-en', bannerText.en);
    note.textContent = bannerText[currentLang()] || bannerText.zh;
    main.insertBefore(note, main.firstChild);
  });
})();
