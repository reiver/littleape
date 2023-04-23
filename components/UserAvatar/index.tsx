import { Avatar, AvatarProps } from "@chakra-ui/react";
import Link from "next/link";
import { FC, useState } from "react";

type UserAvatarType = {
  link?: boolean;
  file?: File;
  name: string;
  src?: string;
  username?: string;
} & AvatarProps;

export const UserAvatar: FC<UserAvatarType> = ({
  link = true,
  file,
  name,
  src: avatarSrc,
  username,
  ...props
}) => {
  const [src, setSrc] = useState<string>(avatarSrc);

  if (file) {
    var fr = new FileReader();
    fr.onload = function () {
      setSrc(fr.result.toString());
    };
    fr.readAsDataURL(file);
  }
  const avatar = <Avatar name={name} src={src ? src : '/PlaceHolder.svg'} {...props} />;
  if (!link || !username) return avatar;
  return (
    <Link href={`/u/${username}`}>
      <a>{avatar}</a>
    </Link>
  );
};
