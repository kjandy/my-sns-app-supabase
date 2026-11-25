import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn/ui が使う、クラス名を結合するための関数。
// cn('px-2', isActive && 'bg-primary') のように、条件付きでクラスを足せる。
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 相対時間の表示（例："3分前"）
// 引数は Date でも文字列（"2026-11-25T10:00:00Z" など）でもよい。
// Supabase から届く時刻は文字列なので、最初に Date に変換している。
export function formatRelativeTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

// 名前の頭文字（アバター画像が無いときに丸の中へ表示する）
export function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}
