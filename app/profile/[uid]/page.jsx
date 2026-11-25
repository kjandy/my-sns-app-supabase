import { ProfileClient } from '@/components/ProfileClient';

// /profile/u1 のように開いたとき、params.uid に "u1" が入る
export default async function ProfilePage({ params }) {
  const { uid } = await params;
  return <ProfileClient uid={uid} />;
}
