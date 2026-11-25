import { PostRow } from '@/components/PostRow';
import { dummyPosts } from '@/lib/dummyData';

// トップページ（タイムライン）。
// 第1回 Step1 では、ダミーデータを並べて表示するだけ。
export default function TopPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl border-x">
      {dummyPosts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </main>
  );
}
