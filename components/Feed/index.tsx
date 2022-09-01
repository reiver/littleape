import { Box, BoxProps, Spinner } from "@chakra-ui/react";
import { API_OUTBOX } from "constants/API";
import { FC } from "react";
import { useAuthStore } from "store";
import useSWR from "swr";
import { Activity, OrderedCollection } from "types/ActivityPub";
import { NoteFeed } from "./Note";

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
      {!data && (
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
          const type = item.object.type;
          switch (type) {
            case "Note":
              return <NoteFeed item={item} key={item.id} />;
          }
        })}
    </Box>
  );
};
