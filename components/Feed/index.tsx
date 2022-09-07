import { Box, BoxProps, Spinner } from "@chakra-ui/react";
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
  const { data, error } = useSWR<OrderedCollection>(API_OUTBOX(username));
  return (
    <Box
      {...props}
      display="flex"
      experimental_spaceY={3}
      flexDirection="column"
    >
      {!data && !error && (
        <Box
          w="full"
          minH="100px"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size="sm" />
        </Box>
      )}
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
  );
};
