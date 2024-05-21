import { Box, chakra } from "@chakra-ui/react";
import { ArrowRightIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from ".";

const LeftIcon = chakra(EnvelopeIcon, {
  baseStyle: { w: 4, strokeWidth: 3 },
});
const RightIcon = chakra(ArrowRightIcon, {
  baseStyle: { w: 4, strokeWidth: 3 },
});

export default {
  component: Button,
  title: "Components/Button",
  argTypes: {
    primary: {
      control: { type: "boolean" },
    },
    variant: {
      options: ["solid", "outline", "link", "ghost"],
      control: "radio",
    },
  },
};

const Template = (args) => (
  <Box display="flex" experimental_spaceY={2} flexDirection="column">
    <Box>
      <Button {...args} />
    </Box>
    <Box>
      <Button leftIcon={<LeftIcon />} {...args} />
    </Box>
    <Box>
      <Button rightIcon={<RightIcon />} {...args} />
    </Box>
    <Box>
      <Button isLoading loadingText="Loading" {...args} />
    </Box>
  </Box>
);

export const Solid = Template.bind({});
Solid.args = {
  primary: true,
  variant: "solid",
  children: "Button",
};

export const Outline = Template.bind({});
Outline.args = {
  primary: false,
  variant: "outline",
  children: "Button",
};

export const Ghost = Template.bind({});
Ghost.args = {
  primary: false,
  variant: "ghost",
  children: "Button",
};

export const Link = Template.bind({});
Link.args = {
  primary: false,
  variant: "link",
  children: "Button",
};
