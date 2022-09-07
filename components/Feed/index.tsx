import { Box, BoxProps, Skeleton } from "@chakra-ui/react";
import { API_OUTBOX } from "constants/API";
import { FC } from "react";
import useSWR from "swr";
import { Activity, OrderedCollection } from "types/ActivityPub";
import { FeedCard } from "./FeedCard";
import { NoteFeed as Note } from "./Note";

const feedComponents = { Note };
type FeedProps = {
  username: string;
} & BoxProps;
export const Feed: FC<FeedProps> = ({ username, ...props }) => {
  const { data } = useSWR<OrderedCollection>(API_OUTBOX(username));
  return (
    <Box display="flex" experimental_spaceY={3} flexDirection="column">
      <Skeleton isLoaded={!!data} rounded="md">
        <Box
          {...props}
          display="flex"
          experimental_spaceY={3}
          flexDirection="column"
          minH="140px"
        >
          {data &&
            data.orderedItems &&
            (data.orderedItems as Activity[]).map((item) => {
              const Component = feedComponents[item.object.type];
              if (!Component) return null;
              return (
                <FeedCard item={item} key={item.id}>
                  <Component item={item} />
                </FeedCard>
              );
            })}
        </Box>
      </Skeleton>
      <Skeleton
        isLoaded={!!data}
        rounded="md"
        minH={!data && "calc(100vh / 10 * 2.5)"}
      />
      <Skeleton
        isLoaded={!!data}
        rounded="md"
        minH={!data && "calc(100vh / 10 * 2)"}
      />
      <Skeleton
        isLoaded={!!data}
        rounded="md"
        minH={!data && "calc(100vh / 10 * 3)"}
      />
    </Box>
  );
};
