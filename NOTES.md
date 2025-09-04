# Project Notes

プロジェクトの作業メモ・決定事項・TODOを日付ごとに残します。

## 使い方
- 追記: `npm run note -- "メモ内容"`
- 例: `npm run note -- "登録フォームにtagsフィールド追加の方針決定"`

## フォーマット
- 見出し: `## YYYY-MM-DD`
- 項目: `- [HH:MM] 内容`

---

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
