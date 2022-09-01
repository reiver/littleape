import {
  Avatar,
  Box,
  BoxProps,
  chakra,
  IconButton,
  Spinner,
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
import { API_OUTBOX } from "constants/API";
import dayjs from "dayjs";
import { FC } from "react";
import { fetcher } from "services/http";
import { useAuthStore } from "store";
import useSWR from "swr";
import { Activity, OrderedCollection } from "types/Outbox";

const HeartIcon = chakra(HeroHeartIcon);
const CommentIcon = chakra(ChatBubbleOvalLeftEllipsisIcon);
const ShareIcon = chakra(HeroShareIcon);
const MoreIcon = chakra(EllipsisVerticalIcon);
const SaveIcon = chakra(BookmarkIcon);

export const Feed: FC<BoxProps> = (props) => {
  const user = useAuthStore((state) => state.user);
  const { data } = useSWR<OrderedCollection>(API_OUTBOX(user.username));
  return (
    <Box
      {...props}
      display="flex"
      experimental_spaceY={3}
      flexDirection="column"
    >
      {!data && <Spinner size="sm" />}
      {data &&
        data.orderedItems &&
        (data.orderedItems as Activity[]).map((item) => {
          const type = item.object.type;
          if (type === "Note")
            return (
              <Card key={item.id}>
                <Box display="flex" justifyContent="space-between">
                  <Box
                    display="flex"
                    alignItems="center"
                    experimental_spaceX={2}
                  >
                    <Avatar w={9} h={9} />
                    <Box>
                      <Text fontSize="sm">
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
        })}
    </Box>
  );
};
