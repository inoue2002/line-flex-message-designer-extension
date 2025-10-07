# LINE Flex Message Designer Extension

Google Chrome 向けの拡張機能です。ポップアップで LINE Flex Message JSON を編集し、整形したプレビューを確認しながらローカルに保存できます。さらに LINE 公式 Flex シミュレーターを開いた際に左下へ入力欄と「生成」ボタンを追加し、ChatGPT API による Flex メッセージ生成をトリガーできます。

## 機能
- Flex Message のサンプルテンプレートを読み込み
- JSON のリアルタイム整形プレビューとエラー表示
- `chrome.storage` へのテンプレート保存
- クリップボードへのコピー
- Flex シミュレーター (`https://developers.line.biz/flex-simulator/`) に入力欄と「生成」ボタンを追加
- 生成ボタンから ChatGPT API (OpenAI) にリクエストして Flex メッセージ JSON を取得し、自動的に保存・クリップボードへコピー
- 生成後、自動で「View JSON」を開き JSON を貼り付けて `Apply` ボタンを押下

## セットアップ
1. このリポジトリをクローン、または `line-flex-message-designer-extension` ディレクトリを取得します。
2. Chrome の拡張機能管理画面（`chrome://extensions/`）を開き、右上の「デベロッパーモード」を有効にします。
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、このディレクトリを選択します。
4. 拡張機能のポップアップを開き、OpenAI の API キー (`sk-` で始まる鍵) を設定してください。キーはローカルの `chrome.storage` に保存され、他へ送信されません。

## 使い方
- ポップアップで JSON を編集し、保存ボタンを押すとテンプレートをストレージに保存できます。
- Flex シミュレーターを開くと左下に追加された入力欄が表示されます。要望を入力して「生成」を押すと ChatGPT API が Flex メッセージを生成し、
  - クリップボードに整形済み JSON をコピー
  - ストレージのテンプレートを上書き（ポップアップを開くと反映）
  - シミュレーターの「View JSON」モーダルを開いて JSON を貼り付け、`Apply` ボタンを自動で押す（失敗した場合はステータスに表示）

## 開発メモ
- 追加のビルドステップが不要な純粋な MV3 拡張機能です。
- UI やバリデーションロジックを拡張する場合は `src/popup/` 以下を編集してください。
- Flex シミュレーター用の追加 UI とロジックは `src/content/inject.js` に定義されています。
- ChatGPT API 呼び出しロジックは `src/background/service-worker.js` に実装されています。必要に応じてモデル名やプロンプトを調整してください。
