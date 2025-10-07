import type {
  FlexTemplate,
  GenerateFlexMessageRequest,
  GenerateFlexMessageResponse
} from '../types/messages';

const FLEX_TEMPLATE_KEY = 'flexTemplate';
const API_KEY_STORAGE_KEY = 'openaiApiKey';

chrome.runtime.onInstalled.addListener(() => {
  console.log('LINE Flex Message Designer installed');
});

chrome.runtime.onMessage.addListener(
  (message: GenerateFlexMessageRequest, _sender, sendResponse: (response: GenerateFlexMessageResponse) => void) => {
    if (message?.type === 'GENERATE_FLEX_MESSAGE') {
      handleGenerateFlexMessage(message.prompt ?? '', message.baseTemplate ?? null)
        .then(sendResponse)
        .catch((error: unknown) => {
          console.error('Failed to generate Flex message', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          sendResponse({ ok: false, error: errorMessage });
        });
      return true; // keep message channel open for async response
    }
    return undefined;
  }
);

async function handleGenerateFlexMessage(
  prompt: string,
  baseTemplate: FlexTemplate | null
): Promise<GenerateFlexMessageResponse> {
  const { [API_KEY_STORAGE_KEY]: apiKey } = await chrome.storage.local.get(API_KEY_STORAGE_KEY);

  if (!apiKey) {
    return { ok: false, error: 'OpenAI APIキーが保存されていません。拡張機能のポップアップで設定してください。' };
  }

  const trimmedPrompt = prompt.trim();
  const userInstruction = trimmedPrompt.length > 0 ? trimmedPrompt : 'ユーザーにおすすめの Flex メッセージを1つ作成してください。';
  const baseTemplateString = baseTemplate ? JSON.stringify(baseTemplate, null, 2) : null;

  const userSections: string[] = [];

  if (baseTemplateString) {
    userSections.push(
      '以下の既存 Flex Message JSON を改善または拡張してください。必要に応じてボタンやテキスト、画像などを調整しても構いませんが、LINE Messaging API の Flex Message 仕様に準拠する JSON を返してください。'
    );
    userSections.push(baseTemplateString);
    userSections.push('改善リクエスト:');
  } else {
    userSections.push('Flex Message を次の条件で作ってください:');
  }

  userSections.push(userInstruction);

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
        content: userSections.join('\n\n')
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

  interface OpenAIChoice {
    message?: { content?: string };
  }

  interface OpenAIResponsePayload {
    choices?: OpenAIChoice[];
  }

  const data = (await response.json()) as OpenAIResponsePayload;
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

function stripCodeFences(content: string | undefined): string {
  if (!content) return '';
  return content.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```([\s\S]*?)```/g, '$1');
}

interface ParseSuccess {
  ok: true;
  value: FlexTemplate;
}

interface ParseFailure {
  ok: false;
  error: unknown;
}

type ParseResult = ParseSuccess | ParseFailure;

function tryParseJson(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error };
  }
}

async function safeReadJson(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}
