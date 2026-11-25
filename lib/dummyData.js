/**
 * ダミーデータ（lib/dummyData.js）
 *
 * 第1〜3回では、データベースの代わりにこのファイルのデータで画面を作る。
 * ★データの「形」は、第6回以降に Supabase から取ってくるデータとそろえてある。
 *   だから、後で「取ってくる場所」を差し替えるだけで画面はそのまま動く。
 */

// 時刻は「今から何分前か」で作る（いつ開いても「3分前」などと表示されるように）
const minutesAgo = (min) => new Date(Date.now() - min * 60 * 1000).toISOString();

// ログイン中ユーザーの代わり（第3回でユーザーを切り替えられるようにする）
export const DUMMY_CURRENT_USER_ID = 'u1';

// ユーザー（第4回以降は Supabase の profiles テーブルになる）
export const dummyUsers = [
  {
    uid: 'u1',
    displayName: '安堂 Koji',
    email: 'koji@example.com',
    photoURL: '',
    bio: 'フロントエンドエンジニア／講師。Next.js と Supabase で授業用のSNSを作っています。',
    location: '東京',
    bannerURL: '',
  },
  {
    uid: 'u2',
    displayName: '佐藤 花子',
    email: 'hanako@example.com',
    photoURL: '',
    bio: 'Webデザイン科2年。UIを作るのが好きです。',
    location: '大阪',
    bannerURL: '',
  },
  {
    uid: 'u3',
    displayName: '田中 太郎',
    email: 'taro@example.com',
    photoURL: '',
    bio: '',
    location: '',
    bannerURL: '',
  },
  {
    uid: 'u4',
    displayName: '鈴木 一郎',
    email: 'ichiro@example.com',
    photoURL: '',
    bio: 'カメラと散歩。',
    location: '福岡',
    bannerURL: '',
  },
];

// フォロー関係（follower がフォローしている人の一覧）
export const dummyFollows = [
  { followerId: 'u1', followeeId: 'u2' },
  { followerId: 'u2', followeeId: 'u1' },
  { followerId: 'u3', followeeId: 'u1' },
];

// 投稿（第6回以降は Supabase の posts テーブル＋集計ビューになる）
//   likeCount / badCount / commentCount … 件数
//   likedByMe / badByMe                  … ログイン中の人が押しているか
export const dummyPosts = [
  {
    id: 'p1',
    userId: 'u1',
    userName: '安堂 Koji',
    userPhotoURL: '',
    content: 'Supabase版のログイン画面ができました！\nメールとGoogleの両方でログインできます。',
    createdAt: minutesAgo(3),
    likeCount: 12,
    badCount: 0,
    commentCount: 2,
    likedByMe: false,
    badByMe: false,
  },
  {
    id: 'p2',
    userId: 'u2',
    userName: '佐藤 花子',
    userPhotoURL: '',
    content: 'RLS、最初は難しいと思ったけど「自分の行だけ」の1行で済むのが分かってスッキリ。',
    createdAt: minutesAgo(15),
    likeCount: 8,
    badCount: 0,
    commentCount: 1,
    likedByMe: true,
    badByMe: false,
  },
  {
    id: 'p3',
    userId: 'u3',
    userName: '田中 太郎',
    userPhotoURL: '',
    content: 'Googleログインで redirect_uri_mismatch が出た…。リダイレクトURIは Supabase の URL を登録するんだった。',
    createdAt: minutesAgo(60),
    likeCount: 5,
    badCount: 1,
    commentCount: 0,
    likedByMe: false,
    badByMe: false,
  },
  {
    id: 'p4',
    userId: 'u4',
    userName: '鈴木 一郎',
    userPhotoURL: '',
    content: 'shadcn/ui のカードとボタンだけで、それっぽい画面がすぐ作れるのがいい。',
    createdAt: minutesAgo(120),
    likeCount: 21,
    badCount: 0,
    commentCount: 0,
    likedByMe: false,
    badByMe: false,
  },
];

// コメント（第8回以降は Supabase の comments テーブルになる）
export const dummyComments = [
  {
    id: 'c1',
    postId: 'p1',
    userId: 'u2',
    userName: '佐藤 花子',
    userPhotoURL: '',
    content: 'おつかれさまです！Googleログイン、私も試してみます。',
    createdAt: minutesAgo(2),
  },
  {
    id: 'c2',
    postId: 'p1',
    userId: 'u3',
    userName: '田中 太郎',
    userPhotoURL: '',
    content: 'リダイレクトURIの設定でつまずきました…',
    createdAt: minutesAgo(1),
  },
  {
    id: 'c3',
    postId: 'p2',
    userId: 'u1',
    userName: '安堂 Koji',
    userPhotoURL: '',
    content: 'その感覚、大事です！',
    createdAt: minutesAgo(10),
  },
];
