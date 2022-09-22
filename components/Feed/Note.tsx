import { Text, TextProps } from "@chakra-ui/react";
import { FC } from "react";

export type NoteFeedProps = {
  item: { object: { content: string } };
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
