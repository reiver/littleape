import { HStack } from "@chakra-ui/react";
import { UserAvatar } from ".";

export default {
  component: UserAvatar,
  title: "Components/Avatar",
  argTypes: {
    name: {
      control: "text",
    },
  },
};

export const Avatar = (args) => (
  <>
    <HStack experimental_spaceX={2}>
      <UserAvatar src="https://bit.ly/3BvUME1" size="xs" {...args} />
      <UserAvatar src="https://bit.ly/3BvUME1" size="sm" {...args} />
      <UserAvatar src="https://bit.ly/3BvUME1" size="md" {...args} />
      <UserAvatar src="https://bit.ly/3BvUME1" size="lg" {...args} />
      <UserAvatar src="https://bit.ly/3BvUME1" size="xl" {...args} />
    </HStack>
    <HStack experimental_spaceX={2}>
      <UserAvatar size="xs" {...args} />
      <UserAvatar size="sm" {...args} />
      <UserAvatar size="md" {...args} />
      <UserAvatar size="lg" {...args} />
      <UserAvatar size="xl" {...args} />
    </HStack>
  </>
);

Avatar.args = {
  name: "John Doe",
};
