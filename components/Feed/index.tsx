import { Box, BoxProps, Spinner } from "@chakra-ui/react";
import { API_OUTBOX } from "constants/API";
import { FC } from "react";
import { useAuthStore } from "store";
import useSWR from "swr";
import { Activity, OrderedCollection } from "types/Outbox";
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
      {!data && <Spinner size="sm" />}
      {data &&
        data.orderedItems &&
        (data.orderedItems as Activity[]).map((item) => {
          const type = item.object.type;
          if (type === "Note") return <NoteFeed item={item} />;
        })}
    </Box>
  );
};
