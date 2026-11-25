/** @type {import('next').NextConfig} */
const nextConfig = {
  // ★この講座では Cache Components を使わない（false にする）
  //   create-next-app の雛形では true になっているが、true のままだと
  //   Cookie（ログイン情報）を読むページをすべて <Suspense> で囲む必要があり、
  //   初学者には負担が大きい。Next.js の次のメジャー版で既定になる予定なので、
  //   発展課題として扱う。
  cacheComponents: false,
  turbopack: {
    rules: {
      // Tailwind CSS v4 を Turbopack で処理する設定（雛形のまま）
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
