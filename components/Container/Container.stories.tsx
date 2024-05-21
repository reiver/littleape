import { Box, chakra, Text } from "@chakra-ui/react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Container } from ".";

const Icon = chakra(ArrowsRightLeftIcon, {
  baseStyle: {
    w: 5,
  },
});
export default {
  component: Container,
  title: "Components/Container",
};

const Template = (args) => (
  <Container {...args}>
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      experimental_spaceY={3}
      bg="gray.300"
      rounded="md"
      py={5}
      color="gray.900"
    >
      <Icon />
      <Text>
        This box is enclosed in a{" "}
        <Text fontWeight="bold" as="span">
          Container
        </Text>{" "}
        so its width doesn&rsquo;t get more than 6xl = 1120
      </Text>
    </Box>
  </Container>
);

export const Default = Template.bind({});
Default.args = {};
