# Mini SNS Frontend

React と Vite で構築した SNS アプリのフロントエンドです。
Rails API と連携し、ログイン、投稿、いいね、コメント、リポスト、プロフィール編集、フォロー機能を利用できます。

## アプリ概要

個人開発ポートフォリオ用のミニSNSです。
バックエンドを Rails API、フロントエンドを React SPA として分離し、API通信・認証状態・投稿関連処理をコンポーネントと Custom Hooks に分けて管理しています。

- デモURL: 準備中
- スクリーンショット: 準備中

## 使用技術

- React 19
- Vite
- Tailwind CSS
- Axios
- ESLint
- Font Awesome

## 主な機能

- 新規登録 / ログイン / ログアウト
- JWT による認証状態管理
- 401 Unauthorized 時の自動ログアウト
- 投稿一覧取得
- 投稿作成 / 削除
- いいね / いいね解除
- コメント投稿
- リポスト
- プロフィール表示 / 編集
- アバター画像アップロード
- フォロー / フォロー解除
- フォロー中 / フォロワー一覧表示
- APIエラーレスポンスの共通ハンドリング

## ディレクトリ構成

```text
src/
├── api/
│   ├── App.jsx
│   ├── AuthProvider.jsx
│   ├── auth.js
│   ├── client.js
│   ├── posts.js
│   ├── useFollow.js
│   ├── usePosts.js
│   └── useUserList.js
├── components/
│   ├── AuthForm.jsx
│   ├── PostItem.jsx
│   ├── ProfileEditForm.jsx
│   ├── ProfileView.jsx
│   └── UserListModal.jsx
├── index.css
└── main.jsx
```

## セットアップ方法

```bash
npm install
npm run dev
```

開発サーバー起動後、ブラウザで表示された Vite のURLにアクセスしてください。
API通信には別途 Rails API サーバーの起動が必要です。

## 環境変数

APIサーバーのURLは `VITE_API_BASE_URL` で指定します。
未設定の場合は開発用として `http://localhost:3000` が使われます。

```env
VITE_API_BASE_URL=http://localhost:3000
```

`VITE_API_BASE_URL` には `/api` などのパスを含めず、APIサーバーの origin のみを指定してください。
各APIのパスはフロントエンド側で `/api/posts.json` のように組み立てています。

`.env` と `.env.*` は Git 管理から除外し、共有用のサンプルが必要な場合は `.env.example` を使用します。

## 開発コマンド

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## 今後の改善予定

- フロントエンドCIの追加
- コンポーネント / Custom Hooks のテスト追加
- ローディング表示と空状態表示の改善
- プロフィール関連処理の Custom Hook 化
- アクセシビリティの改善
