import { DMThreadClient } from '@/components/DMThreadClient';

// /messages/<相手のuid> で、その人とのメッセージ画面を開く
export default async function DMThreadPage({ params }) {
  const { uid } = await params;
  return <DMThreadClient otherUid={uid} />;
}
