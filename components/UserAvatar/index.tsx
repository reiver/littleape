import { Avatar, AvatarProps } from "@chakra-ui/react";
import { FC } from "react";
import { useAuthStore } from "store";

export const UserAvatar: FC<AvatarProps> = (props) => {
  const user = useAuthStore((state) => state.user);
  return <Avatar name={user.display_name} src={user.avatar} {...props} />;
};
