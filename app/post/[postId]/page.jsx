import { PostDetailClient } from '@/components/PostDetailClient';

// /post/p1 のように開いたとき、params.postId に "p1" が入る（動的ルート）。
// Next.js 15 以降、params は Promise なので await してから使う。
export default async function PostPage({ params }) {
  const { postId } = await params;
  return <PostDetailClient postId={postId} />;
}
