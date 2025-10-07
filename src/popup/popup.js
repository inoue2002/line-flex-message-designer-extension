const storageKey = 'flexTemplate';
const apiKeyStorageKey = 'openaiApiKey';

const textarea = document.getElementById('flexJson');
const preview = document.getElementById('preview');
const errorEl = document.getElementById('error');
const copyButton = document.getElementById('copyJson');
const saveButton = document.getElementById('saveTemplate');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');

const defaultTemplate = {
  type: 'flex',
  altText: 'Flex message preview',
  contents: {
    type: 'bubble',
    hero: {
      type: 'image',
      url: 'https://picsum.photos/600/400',
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'LINE Flex Message Designer',
          weight: 'bold',
          size: 'md'
        },
        {
          type: 'text',
          text: 'ここに自由に説明文を追加できます',
          size: 'sm',
          color: '#707070',
          wrap: true
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          action: {
            type: 'uri',
            label: '公式ガイド',
            uri: 'https://developers.line.biz/ja/docs/messaging-api/using-flex-messages/'
          }
        }
      ]
    }
  }
};

init();

async function init() {
  await Promise.all([restoreTemplate(), restoreApiKeyStatus()]);
}

async function restoreTemplate() {
  const { [storageKey]: saved } = await chrome.storage.local.get(storageKey);
  const template = saved ?? defaultTemplate;
  textarea.value = JSON.stringify(template, null, 2);
  renderPreview(textarea.value);
}

async function restoreApiKeyStatus() {
  const { [apiKeyStorageKey]: key } = await chrome.storage.local.get(apiKeyStorageKey);
  updateApiKeyStatus(Boolean(key));
}

function updateApiKeyStatus(hasKey, message) {
  if (message) {
    apiKeyStatus.textContent = message;
  } else {
    apiKeyStatus.textContent = hasKey ? '保存済み' : '未保存';
  }
  apiKeyStatus.classList.toggle('saved', hasKey);
  apiKeyStatus.classList.toggle('error', false);
  if (hasKey) {
    apiKeyInput.placeholder = '保存済み (再入力で更新)';
  } else {
    apiKeyInput.placeholder = 'sk-...';
  }
}

textarea.addEventListener('input', (event) => {
  renderPreview(event.target.value);
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(textarea.value);
    copyButton.textContent = 'コピーしました';
    setTimeout(() => {
      copyButton.textContent = 'JSONをコピー';
    }, 1500);
  } catch (err) {
    errorEl.textContent = 'コピーに失敗しました: ' + err.message;
    errorEl.hidden = false;
  }
});

saveButton.addEventListener('click', async () => {
  try {
    const parsed = JSON.parse(textarea.value);
    await chrome.storage.local.set({ [storageKey]: parsed });
    saveButton.textContent = '保存しました';
    setTimeout(() => {
      saveButton.textContent = 'テンプレートを保存';
    }, 1500);
  } catch (err) {
    errorEl.textContent = '保存できません: ' + err.message;
    errorEl.hidden = false;
  }
});

saveApiKeyButton.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    await chrome.storage.local.remove(apiKeyStorageKey);
    updateApiKeyStatus(false, '未保存 (空のため削除しました)');
    apiKeyInput.value = '';
    return;
  }

  if (!key.startsWith('sk-')) {
    apiKeyStatus.textContent = 'APIキーの形式が正しくない可能性があります。';
    apiKeyStatus.classList.add('error');
    return;
  }

  await chrome.storage.local.set({ [apiKeyStorageKey]: key });
  updateApiKeyStatus(true, '保存しました');
  apiKeyInput.value = '';
});

function renderPreview(source) {
  try {
    const parsed = JSON.parse(source);
    preview.textContent = JSON.stringify(parsed, null, 2);
    errorEl.hidden = true;
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  if (changes[storageKey]) {
    const newValue = changes[storageKey].newValue ?? defaultTemplate;
    textarea.value = JSON.stringify(newValue, null, 2);
    renderPreview(textarea.value);
  }

  if (changes[apiKeyStorageKey]) {
    updateApiKeyStatus(Boolean(changes[apiKeyStorageKey].newValue));
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'FLEX_TEMPLATE_UPDATED' && message?.prettyJson) {
    textarea.value = message.prettyJson;
    renderPreview(textarea.value);
  }
});
