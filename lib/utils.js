import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn/ui が使う、クラス名を結合するための関数。
// cn('px-2', isActive && 'bg-primary') のように、条件付きでクラスを足せる。
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
