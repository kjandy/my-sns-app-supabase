# my-sns-app（Supabase版）

Next.js 16 ＋ Supabase で作る、X（旧Twitter）風の学習用 SNS アプリです（教育コンテンツ）。
投稿・いいね／Bad・コメント・フォロー・リアルタイム更新・ダイレクトメッセージ・メール＋パスワード／Google ログインを、全12回＋準備回で **ゼロから** 作ります。

## 📘 手順書

**[docs/README.md](docs/README.md)** から始めてください。

- 手順書の Step 1つ ＝ このリポジトリのコミット1つ
- 各コミットに `lesson回-stepN` のタグ付き（例：`lesson06-step2`）。どのタグでも `npm run build` と `npm run lint` が通ります

```bash
git tag -l 'lesson*' | sort -V          # タグの一覧
git switch --detach lesson03-step3      # 第3回の完成時点を取り出す
git switch main                         # 最新に戻る
```

## 完成版を動かす

```bash
npm install
cp .env.local.example .env.local   # Supabase の Project URL と Publishable key を書き込む
npm run dev
```

Supabase の SQL Editor で `supabase/migrations/0001〜0008` を番号順に実行しておく必要があります。詳しくは [事前課題](docs/04-0_事前課題_SupabaseとGoogleの準備.md) を参照してください。

## 使っているもの

Next.js 16.4.6 / React 19.3 / Tailwind CSS 4 / shadcn/ui / Zustand 5 / @supabase/supabase-js / @supabase/ssr（JavaScript）
