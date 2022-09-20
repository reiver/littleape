import { Text, TextProps } from "@chakra-ui/react";
import { FC } from "react";
import { Activity } from "types/ActivityPub";

export type NoteFeedProps = {
  item: Activity;
} & TextProps;

export const NoteFeed: FC<NoteFeedProps> = ({ item, ...props }) => {
  return (
    <Text
      p="1"
      py="4"
      whiteSpace="pre-wrap"
      {...props}
      dangerouslySetInnerHTML={{ __html: item.object.content }}
    />
  );
};
