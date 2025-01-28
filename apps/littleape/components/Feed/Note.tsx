import { Text, TextProps } from "@chakra-ui/react";
import { hashtagRegex } from "components/NewPostCard/Editor.Hashtag";
import parse, { Text as TextElement } from "html-react-parser";
import Link from "next/link";
import { FC } from "react";

export type NoteFeedProps = {
  item: { object: { content: string } };
} & TextProps;

export const mentionRegex = /\B@\w+/g;

const hashtagMentionParser = (content: string) => {
  if (content.match(hashtagRegex)) {
    return (
      <Link href={`/tag/${content.replace("#", "")}`} passHref>
        <a className="hashtag">{content}</a>
      </Link>
    );
  }
  if (content.match(mentionRegex)) {
    return (
      <Link href={`/u/${content.replace("@", "")}`} passHref>
        <a className="mention">{content}</a>
      </Link>
    );
  }
};

export const NoteFeed: FC<NoteFeedProps> = ({ item, ...props }) => {
  return (
    <Text p="1" py="4" whiteSpace="pre-wrap" {...props}>
      {parse(item.object.content, {
        replace: (node: TextElement) => {
          if (node.data) {
            return hashtagMentionParser(node.data);
          }
        },
      })}
    </Text>
  );
};
