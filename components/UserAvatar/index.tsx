import { Avatar, AvatarProps } from "@chakra-ui/react";
import Link from "next/link";
import { FC } from "react";
import { useAuthStore } from "store";

type UserAvatarType = {
  link?: boolean;
} & AvatarProps;

export const UserAvatar: FC<UserAvatarType> = ({ link = true, ...props }) => {
  const user = useAuthStore((state) => state.user);
  const avatar = (
    <Avatar name={user.display_name} src={user.avatar} {...props} />
  );
  if (!link) return avatar;
  return (
    <Link href={`/u/${user.username}`}>
      <a>{avatar}</a>
    </Link>
  );
};
