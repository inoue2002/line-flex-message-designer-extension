const apiKeyStorageKey = 'openaiApiKey';

const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');

let statusTimer = null;

init();

async function init() {
  const { [apiKeyStorageKey]: key } = await chrome.storage.local.get(apiKeyStorageKey);
  updateApiKeyStatus(Boolean(key));
}

saveApiKeyButton.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    await chrome.storage.local.remove(apiKeyStorageKey);
    apiKeyInput.value = '';
    updateApiKeyStatus(false);
    setStatus('未保存 (空のため削除しました)', false, 2000);
    return;
  }

  if (!key.startsWith('sk-')) {
    setStatus('APIキーの形式が正しくない可能性があります。', true, 2500);
    return;
  }

  await chrome.storage.local.set({ [apiKeyStorageKey]: key });
  apiKeyInput.value = '';
  updateApiKeyStatus(true);
  setStatus('保存しました', false, 2000);
});

function updateApiKeyStatus(hasKey) {
  const text = hasKey ? '保存済み' : '未保存';
  const timeout = hasKey ? 2000 : undefined;
  setStatus(text, false, timeout);
  apiKeyStatus.classList.toggle('saved', hasKey);
  apiKeyStatus.classList.toggle('error', false);
  apiKeyInput.placeholder = hasKey ? '保存済み (再入力で更新)' : 'sk-...';
}

function setStatus(text, isError, timeoutMs) {
  apiKeyStatus.textContent = text;
  apiKeyStatus.classList.toggle('error', Boolean(isError));

  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }

  if (!isError && typeof timeoutMs === 'number' && timeoutMs > 0) {
    statusTimer = setTimeout(() => {
      apiKeyStatus.textContent = apiKeyStatus.classList.contains('saved') ? '保存済み' : '未保存';
      apiKeyStatus.classList.remove('error');
      statusTimer = null;
    }, timeoutMs);
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes[apiKeyStorageKey]) {
    updateApiKeyStatus(Boolean(changes[apiKeyStorageKey].newValue));
  }
});
