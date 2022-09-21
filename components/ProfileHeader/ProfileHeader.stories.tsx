//@ts-nocheck
import { fetcher } from "services/http";
import { SWRConfig } from "swr";
import { ProfileHeader } from ".";

export default {
  component: ProfileHeader,
  title: "Components/ProfileHeader",
  decorators: [
    (Story) => {
      return (
        <SWRConfig value={{ fetcher }}>
          <Story />
        </SWRConfig>
      );
    },
  ],
};

export const Default = () => (
  <ProfileHeader username="reiver@mastodon.social" />
);
