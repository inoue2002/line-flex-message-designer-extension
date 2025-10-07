import { useEffect, useState } from 'react';

const API_KEY_STORAGE_KEY = 'openaiApiKey';

export const App = () => {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'saved' | 'empty' | 'error' | 'saving'>('empty');
  const [message, setMessage] = useState('未保存');

  useEffect(() => {
    chrome.storage.local.get(API_KEY_STORAGE_KEY).then((items) => {
      const stored = items[API_KEY_STORAGE_KEY];
      if (typeof stored === 'string' && stored.length > 0) {
        setStatus('saved');
        setMessage('保存済み');
      }
    });

    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
      if (areaName !== 'local' || !changes[API_KEY_STORAGE_KEY]) return;
      const newValue = changes[API_KEY_STORAGE_KEY].newValue;
      if (typeof newValue === 'string' && newValue.length > 0) {
        setStatus('saved');
        setMessage('保存済み');
      } else {
        setStatus('empty');
        setMessage('未保存');
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (status === 'saved' && message === '保存しました') {
      const timer = window.setTimeout(() => {
        setMessage('保存済み');
      }, 2000);
      return () => window.clearTimeout(timer);
    }

    if (status === 'empty' && message === '未保存 (空のため削除しました)') {
      const timer = window.setTimeout(() => {
        setMessage('未保存');
      }, 2000);
      return () => window.clearTimeout(timer);
    }

    if (status === 'error') {
      const timer = window.setTimeout(() => {
        setStatus('empty');
        setMessage('未保存');
      }, 2500);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [status, message]);

  const handleSave = async () => {
    const value = inputValue.trim();

    if (!value) {
      await chrome.storage.local.remove(API_KEY_STORAGE_KEY);
      setInputValue('');
      setStatus('empty');
      setMessage('未保存 (空のため削除しました)');
      return;
    }

    if (!value.startsWith('sk-')) {
      setStatus('error');
      setMessage('APIキーの形式が正しくない可能性があります。');
      return;
    }

    setStatus('saving');
    setMessage('保存中...');

    await chrome.storage.local.set({ [API_KEY_STORAGE_KEY]: value });
    setInputValue('');
    setStatus('saved');
    setMessage('保存しました');
  };

  const statusClass = (() => {
    switch (status) {
      case 'saved':
        return 'text-emerald-600';
      case 'error':
        return 'text-rose-500';
      case 'saving':
        return 'text-emerald-500';
      default:
        return 'text-emerald-700/70';
    }
  })();

  const placeholder = status === 'saved' ? '保存済み (再入力で更新)' : 'sk-...';

  return (
    <div className="panel">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-emerald-800">OpenAI API キー</h1>
        <p className="text-xs leading-relaxed text-emerald-800/80">
          ChatGPT 連携に使用する OpenAI API キーを保存します。キーはローカルストレージにだけ保持され、外部には送信されません。
        </p>
      </div>
      <div className="flex items-center gap-3">
        <input
          className="input-field"
          type="password"
          placeholder={placeholder}
          autoComplete="off"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          disabled={status === 'saving'}
        />
        <button className="primary-button" type="button" onClick={handleSave} disabled={status === 'saving'}>
          {status === 'saving' ? '保存中...' : '保存'}
        </button>
      </div>
      <p className={`text-xs ${statusClass}`}>{message}</p>
    </div>
  );
};

export default App;
