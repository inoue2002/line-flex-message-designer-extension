import type {
  FlexTemplate,
  GenerateFlexMessageRequest,
  GenerateFlexMessageResponse
} from '../types/messages';

const FLEX_TEMPLATE_KEY = 'flexTemplate';
const API_KEY_STORAGE_KEY = 'openaiApiKey';

const KNOWLEDGE_SNIPPETS: string[] = [
  'Flex Message では `bubble` だけでなく `carousel` や `flex` コンテナを活用して複数カードを並べられます。用途に応じて `contents` 配列に 10 件までのバブルを入れることができます。',
  'バブルには `size` プロパティ ("nano" | "micro" | "kilo" | "mega" など) を指定でき、目的に応じたカードレイアウトを検討してください。',
  '背景画像の上に文字やボタンを載せる場合は、`position` や `offsetTop` などのプロパティを使ってボックスをオーバーレイし、透過色 (`#03303Acc` など) を敷くと可読性が向上します。',
  'バッジやセール表記は小さな `box` にテキストを配置し、`cornerRadius` や `backgroundColor` を設定すると自然に見えます。価格の値下げは `decoration: "line-through"` を活用してください。',
  '複数画像を組み合わせたコラージュは `layout: "horizontal"` と `layout: "vertical"` を入れ子にし、`flex` と `aspectRatio` で比率をコントロールすると綺麗に配置できます。',
  '丸いアバターやサムネイルは `cornerRadius` を大きく設定し、`width`・`height` を同じ値にすることで実現できます。',
  '`bubble` には `header` / `hero` / `body` / `footer` / `styles` の領域があり、役割に応じて情報を配置すると読みやすくなります。`styles` で各領域の背景色やテキスト色を一括変更できます。',
  '`box` コンテナでは `layout: "vertical" | "horizontal" | "baseline"` を選択できます。`spacing` や `margin` には `sm` などのトークン値を使うと統一感のある余白になります。',
  'テキストは `wrap: true` を設定すると折り返せます。強調する場合は `weight: "bold"` や `style: "italic"` を組み合わせ、色は 6 桁または 8 桁の HEX 表記を使用してください。',
  'ボタンや画像をタップ可能にするには `action` を設定します。URI、メッセージ、postback など LINE Messaging API が許可するアクションタイプを使ってください。',
  '全体の JSON は LINE Messaging API の Flex Message 仕様に準拠している必要があります。不要なキーやサポートされない値は含めないでください。'
];

const CAROUSEL_EXAMPLE: FlexTemplate = {
  type: 'carousel',
  contents: [
    {
      type: 'bubble',
      size: 'micro',
      hero: {
        type: 'image',
        url: 'https://developers-resource.landpress.line.me/fx/clip/clip10.jpg',
        size: 'full',
        aspectMode: 'cover',
        aspectRatio: '320:213'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'Brown Cafe',
            weight: 'bold',
            size: 'sm',
            wrap: true
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png'
              },
              {
                type: 'text',
                text: '4.0',
                size: 'xs',
                color: '#8c8c8c',
                margin: 'md',
                flex: 0
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '東京旅行',
                    wrap: true,
                    color: '#8c8c8c',
                    size: 'xs',
                    flex: 5
                  }
                ]
              }
            ]
          }
        ],
        spacing: 'sm',
        paddingAll: '13px'
      }
    },
    {
      type: 'bubble',
      size: 'micro',
      hero: {
        type: 'image',
        url: 'https://developers-resource.landpress.line.me/fx/clip/clip11.jpg',
        size: 'full',
        aspectMode: 'cover',
        aspectRatio: '320:213'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: "Brown&Cony's Restaurant",
            weight: 'bold',
            size: 'sm',
            wrap: true
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png'
              },
              {
                type: 'text',
                text: '4.0',
                size: 'sm',
                color: '#8c8c8c',
                margin: 'md',
                flex: 0
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '東京旅行',
                    wrap: true,
                    color: '#8c8c8c',
                    size: 'xs',
                    flex: 5
                  }
                ]
              }
            ]
          }
        ],
        spacing: 'sm',
        paddingAll: '13px'
      }
    },
    {
      type: 'bubble',
      size: 'micro',
      hero: {
        type: 'image',
        url: 'https://developers-resource.landpress.line.me/fx/clip/clip12.jpg',
        size: 'full',
        aspectMode: 'cover',
        aspectRatio: '320:213'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'Tata',
            weight: 'bold',
            size: 'sm'
          },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
              },
              {
                type: 'icon',
                size: 'xs',
                url: 'https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png'
              },
              {
                type: 'text',
                text: '4.0',
                size: 'sm',
                color: '#8c8c8c',
                margin: 'md',
                flex: 0
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '東京旅行',
                    wrap: true,
                    color: '#8c8c8c',
                    size: 'xs',
                    flex: 5
                  }
                ]
              }
            ]
          }
        ],
        spacing: 'sm',
        paddingAll: '13px'
      }
    }
  ]
};

const CAROUSEL_EXAMPLE_JSON = JSON.stringify(CAROUSEL_EXAMPLE, null, 2);

const OVERLAY_SALE_CAROUSEL: FlexTemplate = {
  type: 'carousel',
  contents: [
    {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: 'https://developers-resource.landpress.line.me/fx/clip/clip1.jpg',
            size: 'full',
            aspectMode: 'cover',
            aspectRatio: '2:3',
            gravity: 'top'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: "Brown's T-shirts",
                    size: 'xl',
                    color: '#ffffff',
                    weight: 'bold'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '¥35,800',
                    color: '#ebebeb',
                    size: 'sm',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: '¥75,000',
                    color: '#ffffffcc',
                    decoration: 'line-through',
                    gravity: 'bottom',
                    flex: 0,
                    size: 'sm'
                  }
                ],
                spacing: 'lg'
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'filler' },
                  {
                    type: 'box',
                    layout: 'baseline',
                    contents: [
                      { type: 'filler' },
                      {
                        type: 'icon',
                        url: 'https://developers-resource.landpress.line.me/fx/clip/clip14.png'
                      },
                      {
                        type: 'text',
                        text: 'Add to cart',
                        color: '#ffffff',
                        flex: 0,
                        offsetTop: '-2px'
                      },
                      { type: 'filler' }
                    ],
                    spacing: 'sm'
                  },
                  { type: 'filler' }
                ],
                borderWidth: '1px',
                cornerRadius: '4px',
                spacing: 'sm',
                borderColor: '#ffffff',
                margin: 'xxl',
                height: '40px'
              }
            ],
            position: 'absolute',
            offsetBottom: '0px',
            offsetStart: '0px',
            offsetEnd: '0px',
            backgroundColor: '#03303Acc',
            paddingAll: '20px',
            paddingTop: '18px'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'SALE',
                color: '#ffffff',
                align: 'center',
                size: 'xs',
                offsetTop: '3px'
              }
            ],
            position: 'absolute',
            cornerRadius: '20px',
            offsetTop: '18px',
            backgroundColor: '#ff334b',
            offsetStart: '18px',
            height: '25px',
            width: '53px'
          }
        ],
        paddingAll: '0px'
      }
    },
    {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: 'https://developers-resource.landpress.line.me/fx/clip/clip2.jpg',
            size: 'full',
            aspectMode: 'cover',
            aspectRatio: '2:3',
            gravity: 'top'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: "Cony's T-shirts",
                    size: 'xl',
                    color: '#ffffff',
                    weight: 'bold'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '¥35,800',
                    color: '#ebebeb',
                    size: 'sm',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: '¥75,000',
                    color: '#ffffffcc',
                    decoration: 'line-through',
                    gravity: 'bottom',
                    flex: 0,
                    size: 'sm'
                  }
                ],
                spacing: 'lg'
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'filler' },
                  {
                    type: 'box',
                    layout: 'baseline',
                    contents: [
                      { type: 'filler' },
                      {
                        type: 'icon',
                        url: 'https://developers-resource.landpress.line.me/fx/clip/clip14.png'
                      },
                      {
                        type: 'text',
                        text: 'Add to cart',
                        color: '#ffffff',
                        flex: 0,
                        offsetTop: '-2px'
                      },
                      { type: 'filler' }
                    ],
                    spacing: 'sm'
                  },
                  { type: 'filler' }
                ],
                borderWidth: '1px',
                cornerRadius: '4px',
                spacing: 'sm',
                borderColor: '#ffffff',
                margin: 'xxl',
                height: '40px'
              }
            ],
            position: 'absolute',
            offsetBottom: '0px',
            offsetStart: '0px',
            offsetEnd: '0px',
            backgroundColor: '#9C8E7Ecc',
            paddingAll: '20px',
            paddingTop: '18px'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'SALE',
                color: '#ffffff',
                align: 'center',
                size: 'xs',
                offsetTop: '3px'
              }
            ],
            position: 'absolute',
            cornerRadius: '20px',
            offsetTop: '18px',
            backgroundColor: '#ff334b',
            offsetStart: '18px',
            height: '25px',
            width: '53px'
          }
        ],
        paddingAll: '0px'
      }
    }
  ]
};

const OVERLAY_SALE_CAROUSEL_JSON = JSON.stringify(OVERLAY_SALE_CAROUSEL, null, 2);

const PHOTO_COLLAGE_BUBBLE: FlexTemplate = {
  type: 'bubble',
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'image',
            url: 'https://developers-resource.landpress.line.me/fx/clip/clip7.jpg',
            size: '5xl',
            aspectMode: 'cover',
            aspectRatio: '150:196',
            gravity: 'center',
            flex: 1
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'image',
                url: 'https://developers-resource.landpress.line.me/fx/clip/clip8.jpg',
                size: 'full',
                aspectMode: 'cover',
                aspectRatio: '150:98',
                gravity: 'center'
              },
              {
                type: 'image',
                url: 'https://developers-resource.landpress.line.me/fx/clip/clip9.jpg',
                size: 'full',
                aspectMode: 'cover',
                aspectRatio: '150:98',
                gravity: 'center'
              }
            ],
            flex: 1
          }
        ]
      },
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'image',
                url: 'https://developers-resource.landpress.line.me/fx/clip/clip13.jpg',
                aspectMode: 'cover',
                size: 'full'
              }
            ],
            cornerRadius: '100px',
            width: '72px',
            height: '72px'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                contents: [
                  {
                    type: 'span',
                    text: 'brown_05',
                    weight: 'bold',
                    color: '#000000'
                  },
                  { type: 'span', text: '     ' },
                  {
                    type: 'span',
                    text: 'I went to the Brown&Cony cafe in Tokyo and took a picture'
                  }
                ],
                size: 'sm',
                wrap: true
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '1,140,753 Like',
                    size: 'sm',
                    color: '#bcbcbc'
                  }
                ],
                spacing: 'sm',
                margin: 'md'
              }
            ]
          }
        ],
        spacing: 'xl',
        paddingAll: '20px'
      }
    ],
    paddingAll: '0px'
  }
};

const PHOTO_COLLAGE_BUBBLE_JSON = JSON.stringify(PHOTO_COLLAGE_BUBBLE, null, 2);

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

  if (KNOWLEDGE_SNIPPETS.length > 0) {
    const tipList = KNOWLEDGE_SNIPPETS.map((item, index) => `${index + 1}. ${item}`).join('\n');
    userSections.push(
      'Flex Message 作成時のヒント:\n' +
        tipList +
        '\nヒント: 画像 URL が指定されていない場合は https://placehold.jp/30/dd6699/ffffff/300x150.png?text=placeholder+image のようなプレースホルダー画像を一時的に設定してください。'
    );
  }

  userSections.push(
    [
      '参考となる Flex Message JSON サンプル (必要に応じて活用してください):',
      '[Micro Carousel Sample]',
      CAROUSEL_EXAMPLE_JSON,
      '[Overlay Sale Carousel Sample]',
      OVERLAY_SALE_CAROUSEL_JSON,
      '[Photo Collage Bubble Sample]',
      PHOTO_COLLAGE_BUBBLE_JSON
    ].join('\n')
  );

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
