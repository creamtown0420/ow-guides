# Project Notes

プロジェクトの作業メモ・決定事項・TODOを日付ごとに残します。

## 使い方
- 追記: `npm run note -- "メモ内容"`
- 例: `npm run note -- "登録フォームにtagsフィールド追加の方針決定"`

## フォーマット
- 見出し: `## YYYY-MM-DD`
- 項目: `- [HH:MM] 内容`

---

## 2025-09-06
- [00:20] .env 連携の安定化: `src/lib/supabaseClient.js` で `import.meta.env` を可視な形で分割代入に変更（optional chaining を排除）し、Vite が確実に埋め込めるように修正。
- [00:30] デバッグ機能追加: `src/lib/debugFlag.js` と右下のデバッグパネル（`?debug=supabase` / `#debug` / `localStorage.debugSupabase=1`）。Self-Check で env/supaReady/セッション/`codes`/`likes` の到達性を一括確認。
- [00:40] .env.example 追加: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` の雛形を追加（ビルド時に埋め込み）。
- [00:50] CORS/認証URL ガイド整理: Supabase の Allowed Origins と URL Configuration（Site/Redirect）を追加する手順を README/サポートで明示。
- [01:10] Docker 対応: マルチステージ `Dockerfile` 追加（Node 22 で build → NGINX 配信）。`scripts/nginx.conf` で SPA フォールバックとセキュリティヘッダ（X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP）を付与。`.dockerignore` も追加し、`scripts/nginx.conf` を除外しないよう修正。
- [01:20] セキュリティ見直し: service_role キーは未使用・保持しない方針を確認。RLS は `codes/likes/profiles` で select=公開、書込は本人に限定。XSS 系の危険な API（`innerHTML`/`eval` 等）未使用を確認。CSP は Bootstrap 互換のため `style-src 'self' 'unsafe-inline'` を採用（将来的にインライン撤廃で厳格化可）。
- [01:40] プロフィール/表示名機能: `supabase/schema.sql` に `profiles.username` 列と RLS ポリシー（select 全件、insert/update は本人）を追加。`src/App.jsx` に表示名の取得・検証・保存（upsert）を実装し、投稿 `author` に `username || email` を利用。ヘッダーに表示名フォーム追加。
- [01:50] 運用メモ: Docker ビルド時は `--build-arg VITE_SUPABASE_URL`/`--build-arg VITE_SUPABASE_ANON_KEY` を指定。公開時は Supabase の CORS/Redirect に公開 URL を登録。OCI Container Registry/Instances で配信可能。

## 2025-09-02
- [10:00] リポジトリ調査と実装状況把握（React+Vite+Bootstrap、Supabase任意、シード/LSフォールバック確認）
- [10:05] 自動メモ仕組み追加（scripts/note.mjs・NOTES.md・package.json に `note`、READMEに使い方追記）
- [10:20] 登録フォーム拡張（desc/tags/heroes/maps/role/mode 追加、CSVパース、コード英数4–8桁バリデーション）
- [10:30] Supabase insert ペイロード拡張フィールド対応、登録成功でリスト先頭に挿入＆フォーム初期化
- [10:45] 編集/削除UI実装（created_by===user.id のみ表示、インライン編集/保存/キャンセル、削除確認ダイアログ）
- [11:10] ページング導入（12件ずつ、更新日降順）+ 読み込んだIDに限定して likes 集計・自分のlikes補完
- [11:20] 共有リンク改善（ハッシュ `#id` でスクロール＆一時ハイライト、index.css に `.hash-highlight` 追加）
- [11:25] ナビに「投稿」ボタン追加（ログイン済→投稿フォームへスクロール/強調、未ログイン→メール欄へフォーカス、未設定→トースト）
- [11:30] README更新（`npm run note` 追記、フォーム入力仕様を明記）
- [11:40] Supabase設定ガイド共有（.env 作成、Email/Magic Link有効化、Site/Redirect URL、schema.sql実行、Vite再起動手順）
- [11:50] schema.sql 修正：CREATE POLICY IF NOT EXISTS の構文エラー対策として、pg_policies 存在確認付きの DO ブロックに置換（安全な冪等実行に対応）
