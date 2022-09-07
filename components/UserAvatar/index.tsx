import { Avatar, AvatarProps } from "@chakra-ui/react";
import { API_PROFILE } from "constants/API";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import useSWR from "swr";

type UserAvatarType = {
  link?: boolean;
  file?: File;
} & AvatarProps;

export const UserAvatar: FC<UserAvatarType> = ({
  link = true,
  file,
  ...props
}) => {
  const { data: user } = useSWR(API_PROFILE);
  const [src, setSrc] = useState<string>(user.avatar);

  if (file) {
    var fr = new FileReader();
    fr.onload = function () {
      setSrc(fr.result.toString());
    };
    fr.readAsDataURL(file);
  }

  useEffect(() => {
    setSrc(user.avatar);
  }, [user.avatar]);

  const avatar = <Avatar name={user.display_name} src={src} {...props} />;
  if (!link) return avatar;
  return (
    <Link href={`/u/${user.username}`}>
      <a>{avatar}</a>
    </Link>
  );
};
