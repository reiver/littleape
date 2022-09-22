import { Box, Image, Text } from "@chakra-ui/react";
import { Card as C } from ".";

export default {
  component: C,
  title: "Components/Card",
};

const Template = (args) => (
  <C {...args} display="flex" experimental_spaceX={3}>
    <Image src="https://bit.ly/dan-abramov" rounded="md" />
    <Box>
      <Text fontWeight="bold" fontSize="3xl">
        Dan Abramov
      </Text>
      <Text>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry&rsquo;s standard dummy text
        ever since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </Text>
    </Box>
  </C>
);

export const Card = Template.bind({});
