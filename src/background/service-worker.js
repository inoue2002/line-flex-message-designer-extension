const FLEX_TEMPLATE_KEY = 'flexTemplate';
const API_KEY_STORAGE_KEY = 'openaiApiKey';

chrome.runtime.onInstalled.addListener(() => {
  console.log('LINE Flex Message Designer installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GENERATE_FLEX_MESSAGE') {
    handleGenerateFlexMessage(message.prompt ?? '')
      .then(sendResponse)
      .catch((error) => {
        console.error('Failed to generate Flex message', error);
        sendResponse({ ok: false, error: error.message || 'Unknown error' });
      });
    return true; // keep message channel open for async response
  }
  return undefined;
});

async function handleGenerateFlexMessage(prompt) {
  const { [API_KEY_STORAGE_KEY]: apiKey } = await chrome.storage.local.get(API_KEY_STORAGE_KEY);

  if (!apiKey) {
    return { ok: false, error: 'OpenAI APIキーが保存されていません。拡張機能のポップアップで設定してください。' };
  }

  const trimmedPrompt = prompt.trim();
  const userInstruction = trimmedPrompt.length > 0 ? trimmedPrompt : 'ユーザーにおすすめの Flex メッセージを1つ作成してください。';

  const body = {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are an assistant that only outputs valid JSON for LINE Flex Messages. Respond with a single JSON object. Never include explanations or code fences.'
      },
      {
        role: 'user',
        content: `Flex Message を次の条件で作ってください:\n${userInstruction}`
      }
    ]
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorPayload = await safeReadJson(response);
    const message = errorPayload?.error?.message ?? `OpenAI API エラー: ${response.status}`;
    return { ok: false, error: message };
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    return { ok: false, error: 'レスポンスからコンテンツを取得できませんでした。' };
  }

  const normalized = stripCodeFences(rawContent).trim();
  const parsed = tryParseJson(normalized);

  if (!parsed.ok) {
    return { ok: false, error: 'JSON の解析に失敗しました。応答内容: ' + normalized.slice(0, 120) + '...' };
  }

  const prettyJson = JSON.stringify(parsed.value, null, 2);

  await chrome.storage.local.set({ [FLEX_TEMPLATE_KEY]: parsed.value });

  chrome.runtime.sendMessage({
    type: 'FLEX_TEMPLATE_UPDATED',
    template: parsed.value,
    prettyJson
  });

  return {
    ok: true,
    template: parsed.value,
    prettyJson
  };
}

function stripCodeFences(content) {
  if (!content) return '';
  return content.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```([\s\S]*?)```/g, '$1');
}

function tryParseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error };
  }
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}
