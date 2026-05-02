const KEYWORDS = ['fetch', 'logs', 'filter', 'summarize', 'sort', 'limit', 'parse', 'fieldsAdd', 'fieldsRemove', 'makeTimeseries', 'lookup', 'by', 'timeframe', 'asc', 'desc', 'count', 'avg', 'sum', 'min', 'max'];
const FUNCTIONS = ['count()', 'avg(', 'sum(', 'min(', 'max(', 'if(', 'contains(', 'matchesPhrase(', 'startsWith('];

export class QueryLab {
  constructor(state, onRun) {
    this.state = state;
    this.onRun = onRun;
    this.el = document.getElementById('query-lab');
    this.editor = document.getElementById('query-editor');
    this.runBtn = document.getElementById('run-query');

    // Quick action buttons
    document.querySelectorAll('.quick-actions button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const snippet = btn.dataset.snippet;
        if (snippet) {
          const current = this.getText();
          if (current.trim()) {
            this.setText(current + '\n' + snippet);
          } else {
            this.setText(snippet.replace(/^\| /, ''));
          }
          this.highlight();
          this.editor.focus();
        }
      });
    });

    // Run query
    this.runBtn.addEventListener('click', () => {
      const query = this.getText();
      if (query.trim()) {
        this.onRun(query);
      }
    });

    // Ctrl+Enter shortcut
    this.editor.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const query = this.getText();
        if (query.trim()) {
          this.onRun(query);
        }
      }
    });

    // Syntax highlighting on input
    this.editor.addEventListener('input', () => {
      this.highlight();
    });
  }

  show() {
    this.el.classList.remove('hidden');
  }

  getText() {
    return this.editor.innerText;
  }

  setText(text) {
    this.editor.innerText = text;
    this.highlight();
  }

  highlight() {
    const text = this.editor.innerText;
    // Save selection
    const sel = window.getSelection();
    const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    let cursorOffset = 0;
    if (range && this.editor.contains(range.startContainer)) {
      cursorOffset = this.getCursorOffset();
    }

    // Build highlighted HTML
    let html = this.escapeHtml(text);

    // Highlight pipes first
    html = html.replace(/^(\s*\|)/gm, '<span class="hl-pipe">$1</span>');

    // Highlight strings
    html = html.replace(/"([^"]*)"/g, '<span class="hl-string">"$1"</span>');

    // Highlight functions
    for (const fn of FUNCTIONS) {
      const bare = fn.replace('(', '');
      const regex = new RegExp(`\\b${bare.replace('(', '\\(')}`, 'g');
      html = html.replace(regex, `<span class="hl-function">${bare}</span>`);
    }

    // Highlight keywords
    for (const kw of KEYWORDS) {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      html = html.replace(regex, `<span class="hl-keyword">${kw}</span>`);
    }

    // Highlight numbers
    html = html.replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');

    this.editor.innerHTML = html;

    // Restore cursor
    this.setCursorOffset(cursorOffset);
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  getCursorOffset() {
    const sel = window.getSelection();
    if (sel.rangeCount === 0) return 0;
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(this.editor);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  setCursorOffset(offset) {
    const sel = window.getSelection();
    const range = document.createRange();
    let charCount = 0;
    let found = false;

    const traverse = (node) => {
      if (found) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const len = node.textContent.length;
        if (charCount + len >= offset) {
          range.setStart(node, offset - charCount);
          range.collapse(true);
          found = true;
          return;
        }
        charCount += len;
      } else {
        for (const child of node.childNodes) {
          traverse(child);
          if (found) return;
        }
      }
    };

    traverse(this.editor);
    if (!found) {
      // Place at end
      const last = this.editor.lastChild;
      if (last) {
        range.setStartAfter(last);
        range.collapse(true);
      }
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
