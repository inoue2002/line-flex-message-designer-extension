(function init() {
  if (window.__flexDesignerInjected) {
    return;
  }
  window.__flexDesignerInjected = true;

  const container = document.createElement('div');
  container.id = 'flex-designer-extension-panel';
  container.innerHTML = `
    <style>
      #flex-designer-extension-panel {
        position: fixed;
        left: 16px;
        bottom: 16px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        background: rgba(0, 0, 0, 0.72);
        border-radius: 12px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
        z-index: 2147483647;
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #fff;
        max-width: 360px;
      }

      #flex-designer-extension-panel input {
        min-width: 220px;
        flex: 1 1 220px;
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      #flex-designer-extension-panel button {
        appearance: none;
        border: none;
        border-radius: 8px;
        padding: 6px 14px;
        background: #00c300;
        color: #0b2f15;
        font-weight: 600;
        cursor: pointer;
      }

      #flex-designer-extension-panel button:hover {
        filter: brightness(1.1);
      }

      #flex-designer-extension-panel button:disabled {
        opacity: 0.6;
        cursor: progress;
      }

      #flex-designer-extension-status {
        flex-basis: 100%;
        font-size: 12px;
        color: #a5ffb0;
      }

      #flex-designer-extension-status.error {
        color: #ff9a9a;
      }
    </style>
    <input type="text" id="flex-designer-extension-input" placeholder="Flex メッセージの要望を入力" />
    <button id="flex-designer-extension-generate">生成</button>
    <span id="flex-designer-extension-status"></span>
  `;

  document.body.appendChild(container);

  const inputEl = container.querySelector('#flex-designer-extension-input');
  const buttonEl = container.querySelector('#flex-designer-extension-generate');
  const statusEl = container.querySelector('#flex-designer-extension-status');

  buttonEl.addEventListener('click', () => {
    generateFlexMessage();
  });

  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      generateFlexMessage();
    }
  });

  async function generateFlexMessage() {
    const prompt = inputEl.value.trim();
    if (!prompt) {
      setStatus('要望を入力してください。', true);
      inputEl.focus();
      return;
    }

    setLoading(true);
    setStatus('ChatGPT にリクエストしています...', false);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_FLEX_MESSAGE',
        prompt
      });

      if (!response || !response.ok) {
        setStatus(response?.error ?? '生成に失敗しました。', true);
        return;
      }

      const applyResult = await applyToSimulator(response.prettyJson);

      if (!applyResult.ok) {
        setStatus('JSON は生成しましたが自動貼り付けに失敗しました: ' + applyResult.error, true);
      } else {
        setStatus('シミュレーターへ JSON を貼り付けて反映しました。', false, 2000);
      }

      try {
        await navigator.clipboard.writeText(response.prettyJson);
      } catch (err) {
        console.warn('Failed to copy to clipboard', err);
      }

      inputEl.value = '';
    } catch (error) {
      console.error(error);
      setStatus('エラーが発生しました: ' + (error?.message || error), true);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    buttonEl.disabled = isLoading;
    buttonEl.textContent = isLoading ? '生成中...' : '生成';
  }

  let statusTimer = null;

  function setStatus(message, isError, timeoutMs) {
    statusEl.textContent = message;
    statusEl.classList.toggle('error', Boolean(isError));

    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }

    if (!isError && typeof timeoutMs === 'number' && timeoutMs > 0) {
      statusTimer = setTimeout(() => {
        statusEl.textContent = '';
        statusEl.classList.remove('error');
        statusTimer = null;
      }, timeoutMs);
    }
  }

  async function applyToSimulator(json) {
    try {
      const editorHandle = await ensureJsonEditor();
      if (!editorHandle.ok) {
        return editorHandle;
      }

      const setResult = await setEditorContent(editorHandle, json);
      if (!setResult.ok) {
        return setResult;
      }

      const applyBtn = await waitFor(() => findApplyButton(editorHandle.root || document), 2000, 120);
      if (!applyBtn) {
        return { ok: false, error: 'Apply ボタンが見つかりません。' };
      }

      applyBtn.click();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || String(error) };
    }
  }

  async function ensureJsonEditor() {
    const existing = findJsonEditor();
    if (existing) {
      return { ok: true, ...existing };
    }

    const trigger = findViewJsonButton();
    if (!trigger) {
      return { ok: false, error: 'View JSON ボタンが見つかりません。' };
    }

    trigger.click();

    const editor = await waitFor(findJsonEditor, 4000, 150);
    if (!editor) {
      return { ok: false, error: 'JSON エディタが見つかりません。' };
    }

    return { ok: true, ...editor };
  }

  function findJsonEditor() {
    const dialog = findJsonDialog();
    if (!dialog) {
      return null;
    }

    const textarea = Array.from(dialog.querySelectorAll('textarea')).find(isVisible);
    if (textarea) {
      return { type: 'textarea', element: textarea, root: dialog };
    }

    if (window.monaco?.editor?.getModels) {
      const models = window.monaco.editor.getModels();
      if (models.length > 0) {
        return { type: 'monaco', models, root: dialog };
      }
    }

    const contentEditable = Array.from(dialog.querySelectorAll('[contenteditable="true"]')).find(isVisible);
    if (contentEditable) {
      return { type: 'contenteditable', element: contentEditable, root: dialog };
    }

    return null;
  }

  function findJsonDialog() {
    const selectors = ['[role="dialog"]', '.modal', '.dialog', '.MuiDialog-root', '.ant-modal'];
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const node of nodes) {
        if (!isVisible(node)) continue;
        const text = node.textContent || '';
        if (/json/i.test(text)) {
          return node;
        }
      }
    }

    const monacoContainer = document.querySelector('.monaco-editor');
    if (monacoContainer && isVisible(monacoContainer)) {
      return monacoContainer.closest('div');
    }

    return null;
  }

  function findViewJsonButton() {
    const iconButton = document.querySelector('button.btn.btn-secondary i.fa.fa-code');
    if (iconButton) {
      const hostButton = iconButton.closest('button');
      if (hostButton && isVisible(hostButton)) {
        return hostButton;
      }
    }

    return findButtonByText([
      'View JSON',
      'View Json',
      'View as JSON',
      'View as Json',
      'JSONを表示',
      'JSON を表示',
      'Show JSON'
    ]);
  }

  async function setEditorContent(handle, json) {
    if (handle.type === 'textarea') {
      handle.element.value = json;
      handle.element.dispatchEvent(new Event('input', { bubbles: true }));
      handle.element.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }

    if (handle.type === 'contenteditable') {
      handle.element.textContent = json;
      handle.element.dispatchEvent(new Event('input', { bubbles: true }));
      handle.element.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }

    if (handle.type === 'monaco') {
      try {
        let updated = false;
        handle.models.forEach((model) => {
          try {
            if (typeof model.getValue === 'function' && typeof model.setValue === 'function') {
              const current = (model.getValue() || '').trim();
              if (!current || current.startsWith('{') || current.startsWith('[')) {
                model.setValue(json);
                updated = true;
              }
            }
          } catch (err) {
            console.warn('Failed to set monaco model', err);
          }
        });
        if (updated) {
          if (window.monaco?.editor?.getEditors) {
            const editors = window.monaco.editor.getEditors();
            editors?.forEach((editor) => {
              try {
                editor.trigger('flex-designer-extension', 'type', { text: '' });
              } catch (err) {
                // fall through
              }
            });
          }
          return { ok: true };
        }
      } catch (error) {
        return { ok: false, error: error?.message || String(error) };
      }
    }

    return { ok: false, error: '対応するエディタが見つかりません。' };
  }

  function findApplyButton(scope = document) {
    const direct = scope.querySelector('[data-testid="apply-json"], [data-testid="view-json-apply"]');
    if (direct && isVisible(direct)) {
      return direct;
    }

    const candidates = Array.from(scope.querySelectorAll('button, [role="button"], a'));
    const labels = ['apply', '適用', '適⽤'];
    const match = candidates.find((btn) => {
      if (!isVisible(btn)) return false;
      const text = normalizeText(btn.textContent);
      if (!text) return false;
      return labels.some((label) => text.includes(label));
    });

    if (match) {
      return match;
    }

    const primaryButtons = Array.from(scope.querySelectorAll('button.btn.btn-primary'));
    return primaryButtons.find((btn) => isVisible(btn) && normalizeText(btn.textContent).includes('apply')) || null;
  }

  function findButtonByText(labels, scope = document) {
    const lowered = labels.map((label) => label.toLowerCase());
    const elements = Array.from(scope.querySelectorAll('button, [role="button"], a'));
    for (const el of elements) {
      if (!isVisible(el)) continue;
      const text = normalizeText(el.textContent);
      if (!text) continue;
      if (lowered.some((label) => text.includes(label))) {
        return el;
      }
    }

    return null;
  }

  function normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style && style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0.05;
  }

  function waitFor(getter, timeout = 3000, interval = 150) {
    return new Promise((resolve) => {
      const start = Date.now();

      const timer = setInterval(() => {
        const value = getter();
        if (value) {
          clearInterval(timer);
          resolve(value);
        } else if (Date.now() - start > timeout) {
          clearInterval(timer);
          resolve(null);
        }
      }, interval);
    });
  }
})();
