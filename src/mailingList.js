export const MAILCHIMP_ACTION = 'https://urbanhikersf.us6.list-manage.com/subscribe/post?u=1554420032553d4d674c87ce9&id=281e883bf2&f_id=005124e2f0';

// Mailchimp's own embedded form uses this JSONP endpoint. No API key is needed.
export function subscribeToMailingList(fields, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const callback = `sfMailchimp_${crypto.randomUUID().replaceAll('-', '')}`;
    const url = new URL(MAILCHIMP_ACTION.replace('/post?', '/post-json?'));
    for (const [key, value] of fields) url.searchParams.set(key, value);
    url.searchParams.set('c', callback);
    const script = document.createElement('script');
    let finished = false;
    let timer;
    const finish = (error, response) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      script.remove();
      // A request already in flight can arrive after timeout/unmount.
      window[callback] = () => {};
      setTimeout(() => { delete window[callback]; }, 60000);
      if (error) reject(error); else resolve(response);
    };
    const abort = () => finish(new Error('Aborted'));
    if (signal?.aborted) { abort(); return; }
    window[callback] = response => {
      if (!response || !['success', 'error'].includes(response.result) || typeof response.msg !== 'string') {
        finish(new Error('Unexpected response')); return;
      }
      finish(null, response);
    };
    script.onerror = () => finish(new Error('Connection failed'));
    script.src = url.href;
    script.referrerPolicy = 'no-referrer';
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(new Error('Timed out')), 15000);
    document.head.append(script);
  });
}

export function mailingListMessage(html) {
  // Never render third-party response HTML in the page.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent.replace(/^\d+\s*-\s*/, '').trim();
}
