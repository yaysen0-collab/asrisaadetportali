(() => {
  // Şapka işaretlerini yalnızca sayfada gösterirken kaldırır.
  const normalize = (value) => value.normalize('NFD').replace(/\u0302/g, '').normalize('NFC');
  const safeTags = 'script,style,noscript,textarea,input,select,code,pre';
  const safeAttributes = ['alt', 'title', 'aria-label', 'placeholder'];

  function clean(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || parent.isContentEditable || parent.closest(safeTags)) continue;
      const next = normalize(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      const elements = [root, ...root.querySelectorAll('*')];
      for (const element of elements) {
        for (const attr of safeAttributes) {
          if (!element.hasAttribute(attr)) continue;
          const value = element.getAttribute(attr);
          const next = normalize(value);
          if (value !== next) element.setAttribute(attr, next);
        }
      }
    }
  }

  function cleanMetadata() {
    // Only assign when the text really changes: every assignment to document.title creates a
    // DOM mutation, which re-triggered this observer forever and froze the page.
    const title = normalize(document.title || '');
    if (title !== document.title) document.title = title;
    document.querySelectorAll('meta[content]').forEach((meta) => {
      const value = meta.getAttribute('content');
      const next = normalize(value);
      if (value !== next) meta.setAttribute('content', next);
    });
  }

  function start() {
    clean(document.body);
    cleanMetadata();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') clean(record.target.parentElement);
        else record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) clean(node.parentElement);
          else if (node.nodeType === Node.ELEMENT_NODE) clean(node);
        });
      }
      cleanMetadata();
      observer.takeRecords(); // drop the mutations caused by our own clean-up
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    observer.observe(document.head, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['content'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
