import {
  Avatar,
  Box,
  BoxProps,
  chakra,
  IconButton,
  Text,
} from "@chakra-ui/react";
import {
  BookmarkIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  EllipsisVerticalIcon,
  HeartIcon as HeroHeartIcon,
  ShareIcon as HeroShareIcon,
} from "@heroicons/react/24/outline";
import { Card } from "components/Card/Index";
import dayjs from "dayjs";
import { FC } from "react";
import { Activity } from "types/ActivityPub";

const HeartIcon = chakra(HeroHeartIcon);
const CommentIcon = chakra(ChatBubbleOvalLeftEllipsisIcon);
const ShareIcon = chakra(HeroShareIcon);
const MoreIcon = chakra(EllipsisVerticalIcon);
const SaveIcon = chakra(BookmarkIcon);

export type NoteFeedProps = {
  item: Activity;
} & BoxProps;

export const NoteFeed: FC<NoteFeedProps> = ({ item, ...props }) => {
  return (
    <Card {...props}>
      <Box display="flex" justifyContent="space-between" flexWrap="nowrap">
        <Box
          display="flex"
          alignItems="center"
          experimental_spaceX={2}
          flexGrow={1}
          maxW="calc(100% - 32px)"
        >
          <Avatar w={9} h={9} />
          <Box flexGrow={1}>
            <Text fontSize="sm" maxWidth="calc(100% - 32px)">
              {typeof item.actor == "string" && item.actor}
            </Text>
            <Text fontSize="xs" opacity={0.5} mt={-1}>
              {typeof item.actor == "string" &&
                dayjs().from(dayjs(item.published))}
            </Text>
          </Box>
        </Box>
        <Box>
          <IconButton aria-label="more" size="sm" bg="transparent">
            <MoreIcon w={5} h={5} />
          </IconButton>
        </Box>
      </Box>
      <Text p="1" py="4" whiteSpace="pre-wrap">
        {item.object.content}
      </Text>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" experimental_spaceX={2}>
          <IconButton aria-label="like" size="sm" bg="transparent">
            <HeartIcon w={5} h={5} />
          </IconButton>
          <IconButton aria-label="comment" size="sm" bg="transparent">
            <CommentIcon w={5} h={5} />
          </IconButton>
          <IconButton aria-label="share" size="sm" bg="transparent">
            <ShareIcon w={5} h={5} />
          </IconButton>
        </Box>
        <Box>
          <IconButton aria-label="more" size="sm" bg="transparent">
            <SaveIcon w={5} h={5} />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};
