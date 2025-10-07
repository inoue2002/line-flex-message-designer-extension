import type { FlexTemplate, GenerateFlexMessageResponse } from '../types/messages';

declare global {
  interface Window {
    __flexDesignerInjected?: boolean;
    monaco?: {
      editor?: {
        getModels(): MonacoModel[];
        getEditors?(): MonacoEditor[];
      };
    };
  }
}

type MonacoModel = {
  getValue(): string;
  setValue(value: string): void;
};

type MonacoEditor = {
  trigger(source: string, handlerId: string, payload: { text: string }): void;
};

type EditorHandle =
  | { kind: 'textarea'; element: HTMLTextAreaElement; root: HTMLElement }
  | { kind: 'contenteditable'; element: HTMLElement; root: HTMLElement }
  | { kind: 'monaco'; models: MonacoModel[]; root: HTMLElement };

type OperationSuccess<T extends object = object> = { ok: true } & T;
type OperationFailure = { ok: false; error: string };
type OperationResult<T extends object = object> = OperationSuccess<T> | OperationFailure;

const STORAGE_KEY = 'flexTemplate';

interface PanelElements {
  container: HTMLDivElement;
  input: HTMLInputElement;
  generateButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  status: HTMLSpanElement;
}

let includeExistingTemplate = true;
let statusTimer: number | null = null;
let panel: PanelElements | null = null;

(function init() {
  if (window.__flexDesignerInjected) {
    return;
  }
  window.__flexDesignerInjected = true;

  panel = createPanel();
  document.body.appendChild(panel.container);

  makePanelDraggable(panel.container);
  panel.generateButton.addEventListener('click', () => {
    void generateFlexMessage();
  });
  panel.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void generateFlexMessage();
    }
  });

  panel.resetButton.addEventListener('click', () => {
    includeExistingTemplate = !includeExistingTemplate;
    updateResetButton();
    setStatus(
      includeExistingTemplate
        ? '既存 JSON を含めて生成します。'
        : '次回は既存 JSON を含めず生成します。',
      false,
      2000
    );
  });

  updateResetButton();
})();

function createPanel(): PanelElements {
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
        max-width: 420px;
        cursor: grab;
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
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.15s ease, opacity 0.15s ease;
      }

      #flex-designer-extension-generate {
        background: #00c300;
        color: #0b2f15;
      }

      #flex-designer-extension-reset {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
      }

      #flex-designer-extension-reset.flex-designer-reset-active {
        background: rgba(255, 255, 255, 0.35);
        color: #0b2f15;
      }

      #flex-designer-extension-panel button:hover:not(:disabled) {
        filter: brightness(1.1);
      }

      #flex-designer-extension-panel button:disabled {
        opacity: 0.55;
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

      #flex-designer-extension-panel.dragging {
        cursor: grabbing;
        user-select: none;
      }
    </style>
    <input type="text" id="flex-designer-extension-input" placeholder="Flex メッセージの要望を入力" />
    <button id="flex-designer-extension-generate">生成</button>
    <button id="flex-designer-extension-reset" title="既存 JSON を次回のリクエストに含めません">リセット</button>
    <span id="flex-designer-extension-status"></span>
  `;

  const input = getElement<HTMLInputElement>(container, '#flex-designer-extension-input');
  const generateButton = getElement<HTMLButtonElement>(container, '#flex-designer-extension-generate');
  const resetButton = getElement<HTMLButtonElement>(container, '#flex-designer-extension-reset');
  const status = getElement<HTMLSpanElement>(container, '#flex-designer-extension-status');

  return { container, input, generateButton, resetButton, status };
}

async function generateFlexMessage(): Promise<void> {
  if (!panel) return;

  const prompt = panel.input.value.trim();
  if (!prompt) {
    setStatus('要望を入力してください。', true);
    panel.input.focus();
    return;
  }

  setLoading(true);
  setStatus('ChatGPT にリクエストしています...', false);

  const useExistingTemplate = includeExistingTemplate;

  try {
    const baseTemplate = useExistingTemplate ? await fetchStoredTemplate() : null;

    const response = (await chrome.runtime.sendMessage({
      type: 'GENERATE_FLEX_MESSAGE',
      prompt,
      baseTemplate
    })) as GenerateFlexMessageResponse;

    if (!response || !response.ok) {
      setStatus(response?.error ?? '生成に失敗しました。', true);
      return;
    }

    const prettyJson = response.prettyJson ?? (response.template ? JSON.stringify(response.template, null, 2) : '');

    if (!prettyJson) {
      setStatus('生成された JSON が空でした。', true);
      return;
    }

    const applyResult = await applyToSimulator(prettyJson);

    if (!applyResult.ok) {
      setStatus('JSON は生成しましたが自動貼り付けに失敗しました: ' + applyResult.error, true);
    } else {
      setStatus('シミュレーターへ JSON を貼り付けて反映しました。', false, 2000);
    }

    try {
      await navigator.clipboard.writeText(prettyJson);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }

    panel.input.value = '';
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    setStatus('エラーが発生しました: ' + message, true);
  } finally {
    setLoading(false);
    if (!useExistingTemplate) {
      includeExistingTemplate = true;
      updateResetButton();
    }
  }
}

async function fetchStoredTemplate(): Promise<FlexTemplate | null> {
  const stored = (await chrome.storage.local.get(STORAGE_KEY)) as { [STORAGE_KEY]?: FlexTemplate };
  return stored?.[STORAGE_KEY] ?? null;
}

function setLoading(isLoading: boolean): void {
  if (!panel) return;
  panel.generateButton.disabled = isLoading;
  panel.generateButton.textContent = isLoading ? '生成中...' : '生成';
  panel.resetButton.disabled = isLoading;
}

function setStatus(message: string, isError: boolean, timeoutMs?: number): void {
  if (!panel) return;
  panel.status.textContent = message;
  panel.status.classList.toggle('error', isError);

  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }

  if (!isError && typeof timeoutMs === 'number' && timeoutMs > 0) {
    statusTimer = window.setTimeout(() => {
      if (!panel) return;
      panel.status.textContent = '';
      panel.status.classList.remove('error');
      statusTimer = null;
    }, timeoutMs);
  }
}

function updateResetButton(): void {
  if (!panel) return;
  const active = !includeExistingTemplate;
  panel.resetButton.textContent = active ? 'リセット解除' : 'リセット';
  panel.resetButton.title = active
    ? '既存 JSON を再び含めるにはクリック'
    : '既存 JSON を次回のリクエストに含めません';
  panel.resetButton.classList.toggle('flex-designer-reset-active', active);
}

function makePanelDraggable(container: HTMLDivElement): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    const tagName = (event.target as HTMLElement | null)?.tagName ?? '';
    if (['INPUT', 'BUTTON', 'TEXTAREA'].includes(tagName)) {
      return;
    }

    const rect = container.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    isDragging = true;

    container.classList.add('dragging');
    container.style.right = 'auto';
    container.style.bottom = 'auto';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });

    event.preventDefault();
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;

    const maxLeft = Math.max(window.innerWidth - container.offsetWidth - 8, 8);
    const maxTop = Math.max(window.innerHeight - container.offsetHeight - 8, 8);

    const nextLeft = Math.min(Math.max(event.clientX - offsetX, 8), maxLeft);
    const nextTop = Math.min(Math.max(event.clientY - offsetY, 8), maxTop);

    container.style.left = `${nextLeft}px`;
    container.style.top = `${nextTop}px`;
  };

  const onMouseUp = () => {
    if (!isDragging) return;

    isDragging = false;
    container.classList.remove('dragging');
    document.removeEventListener('mousemove', onMouseMove);
  };

  container.addEventListener('mousedown', onMouseDown);
}

async function applyToSimulator(json: string): Promise<OperationResult> {
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
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

async function ensureJsonEditor(): Promise<OperationResult<EditorHandle>> {
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

function findJsonEditor(): EditorHandle | null {
  const dialog = findJsonDialog();
  if (!dialog) {
    return null;
  }

  const textarea = Array.from(dialog.querySelectorAll('textarea')).find(isVisible) as HTMLTextAreaElement | undefined;
  if (textarea) {
    return { kind: 'textarea', element: textarea, root: dialog };
  }

  const monacoModels = window.monaco?.editor?.getModels?.() ?? [];
  if (monacoModels.length > 0) {
    return { kind: 'monaco', models: monacoModels, root: dialog };
  }

  const contentEditable = Array.from(dialog.querySelectorAll('[contenteditable="true"]')).find(isVisible) as
    | HTMLElement
    | undefined;
  if (contentEditable) {
    return { kind: 'contenteditable', element: contentEditable, root: dialog };
  }

  return null;
}

function findJsonDialog(): HTMLElement | null {
  const selectors = ['[role="dialog"]', '.modal', '.dialog', '.MuiDialog-root', '.ant-modal'];
  for (const selector of selectors) {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    for (const node of nodes) {
      if (!isVisible(node)) continue;
      const text = node.textContent || '';
      if (/json/i.test(text)) {
        return node;
      }
    }
  }

  const monacoContainer = document.querySelector<HTMLElement>('.monaco-editor');
  if (monacoContainer && isVisible(monacoContainer)) {
    return monacoContainer.closest('div');
  }

  return null;
}

function findViewJsonButton(): HTMLElement | null {
  const iconButton = document.querySelector('button.btn.btn-secondary i.fa.fa-code');
  if (iconButton) {
    const hostButton = iconButton.closest('button');
    if (hostButton && isVisible(hostButton)) {
      return hostButton as HTMLElement;
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

async function setEditorContent(handle: EditorHandle, json: string): Promise<OperationResult> {
  if (handle.kind === 'textarea') {
    handle.element.value = json;
    handle.element.dispatchEvent(new Event('input', { bubbles: true }));
    handle.element.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true };
  }

  if (handle.kind === 'contenteditable') {
    handle.element.textContent = json;
    handle.element.dispatchEvent(new Event('input', { bubbles: true }));
    handle.element.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true };
  }

  if (handle.kind === 'monaco') {
    try {
      let updated = false;
      handle.models.forEach((model) => {
        try {
          const current = model.getValue?.().trim() ?? '';
          if (!current || current.startsWith('{') || current.startsWith('[')) {
            model.setValue(json);
            updated = true;
          }
        } catch (err) {
          console.warn('Failed to set monaco model', err);
        }
      });

      if (updated && window.monaco?.editor?.getEditors) {
        window.monaco.editor.getEditors()?.forEach((editor) => {
          try {
            editor.trigger('flex-designer-extension', 'type', { text: '' });
          } catch (err) {
            // ignore
          }
        });
      }

      return updated ? { ok: true } : { ok: false, error: 'Monaco エディタを更新できませんでした。' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: message };
    }
  }

  return { ok: false, error: '対応するエディタが見つかりません。' };
}

function findApplyButton(scope: Document | HTMLElement = document): HTMLElement | null {
  const direct = scope.querySelector<HTMLElement>('[data-testid="apply-json"], [data-testid="view-json-apply"]');
  if (direct && isVisible(direct)) {
    return direct;
  }

  const candidates = Array.from(scope.querySelectorAll<HTMLElement>('button, [role="button"], a'));
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

  const primaryButtons = Array.from(scope.querySelectorAll<HTMLElement>('button.btn.btn-primary'));
  return primaryButtons.find((btn) => isVisible(btn) && normalizeText(btn.textContent).includes('apply')) || null;
}

function findButtonByText(labels: string[], scope: Document | HTMLElement = document): HTMLElement | null {
  const lowered = labels.map((label) => label.toLowerCase());
  const elements = Array.from(scope.querySelectorAll<HTMLElement>('button, [role="button"], a'));

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

function normalizeText(text: string | null | undefined): string {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isVisible(el: Element | null): el is HTMLElement {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0.05;
}

function waitFor<T>(getter: () => T | null, timeout = 3000, interval = 150): Promise<T | null> {
  return new Promise((resolve) => {
    const start = Date.now();

    const timer = window.setInterval(() => {
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

function getElement<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Element not found: ${selector}`);
  }
  return el;
}
