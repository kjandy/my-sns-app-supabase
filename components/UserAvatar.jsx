import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitial } from '@/lib/utils';

/**
 * ユーザーのアイコン（components/UserAvatar.jsx）
 * 画像があれば画像を、無ければ名前の頭文字を表示する。
 * 投稿・コメント・ヘッダー・プロフィールなど、あちこちで使うので部品にしておく。
 */
export const UserAvatar = ({ name, photoURL, className, fallbackClassName }) => (
  <Avatar className={cn('size-10 shrink-0', className)}>
    {photoURL ? <AvatarImage src={photoURL} alt={name} /> : null}
    <AvatarFallback
      className={cn('bg-primary text-sm font-bold text-primary-foreground', fallbackClassName)}
    >
      {getInitial(name)}
    </AvatarFallback>
  </Avatar>
);
