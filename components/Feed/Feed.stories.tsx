import { Box } from "@chakra-ui/react";
import { fetcher } from "services/http";
import { SWRConfig } from "swr";
import { Feed } from ".";
import { FeedCard } from "./FeedCard";
import { NoteFeed } from "./Note";

export default {
  component: Feed,
  title: "Components/Feed",
  decorators: [
    (Story) => (
      <SWRConfig value={{ fetcher }}>
        <Box maxW="xl">
          <Story />
        </Box>
      </SWRConfig>
    ),
  ],
};

export const Note = () => (
  <FeedCard
    item={{
      actor: "Narixius",
      published: "2022-12-12 12:12",
    }}
  >
    <NoteFeed
      item={{
        object: {
          content: "text",
        },
      }}
    />
  </FeedCard>
);
Note.args = {};

export const GroupOfFeed = () => <Feed username="narixius" />;
