# LINE Flex Message Designer Extension

Google Chrome 向けの拡張機能です。拡張ポップアップでは OpenAI API キーだけを設定し、LINE 公式 Flex シミュレーター上では左下の入力欄から ChatGPT API へリクエストして Flex メッセージ JSON を自動生成・反映できます。

## 機能
- ポップアップで OpenAI API キー (`sk-...`) を安全に保存（React + TypeScript + Tailwind CSS）
- Flex シミュレーター (`https://developers.line.biz/flex-simulator/`) に入力欄と「生成」ボタンを追加
- 生成ボタンから ChatGPT API (OpenAI) にリクエストして Flex メッセージ JSON を取得
- 生成した JSON をクリップボードへコピーしつつ、シミュレーターの「View as JSON」モーダルを開いて貼り付け、`Apply` ボタンを自動で押下

## セットアップ
1. このリポジトリをクローン、または `line-flex-message-designer-extension` ディレクトリを取得します。
2. 依存をインストール: `npm install`
3. `npm run build` で React/Tailwind の成果物を `dist/` に生成します（開発中は `npm run dev` でウォッチ可能）。
4. Chrome の拡張機能管理画面（`chrome://extensions/`）を開き、右上の「デベロッパーモード」を有効にします。
5. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist/` ディレクトリを選択します。
6. 拡張機能のポップアップを開き、OpenAI の API キー (`sk-` で始まる鍵) を設定してください。キーはローカルの `chrome.storage` に保存され、他へ送信されません。

## 使い方
- Flex シミュレーターを開くと左下に追加された入力欄が表示されます。要望を入力して「生成」を押すと ChatGPT API が Flex メッセージを生成し、
  - クリップボードに整形済み JSON をコピー
  - シミュレーターの「View as JSON」モーダルを自動で開く
  - JSON を貼り付け、`Apply` を押下してプレビューに反映
  - 処理状況は左下のステータスで確認可能

## 開発メモ
- Flex シミュレーター用の追加 UI とロジックは `src/content/inject.js` に定義されています。
- ChatGPT API 呼び出しロジックは `src/background/service-worker.js` に実装されています。必要に応じてモデル名やプロンプトを調整してください。
- バックグラウンド・コンテンツスクリプトは TypeScript (`src/background/`, `src/content/`) で実装され、ビルド時に `dist/` へトランスパイルされます。
- ポップアップは API キー設定のみを扱い、`src/popup/` 以下に実装されています。Tailwind のエントリーポイントは `src/popup/tailwind.css` です。
- `npm run dev` はポップアップの React/Tailwind をウォッチします。背景スクリプトやマニフェストを変更した場合は `npm run build` で `dist/` を再生成してください。
