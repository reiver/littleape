import { chakra, VStack } from "@chakra-ui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from ".";

const SearchIcon = chakra(MagnifyingGlassIcon, { baseStyle: { w: 4 } });

export default {
  component: Input,
  title: "Components/Input",
};

export const Inputs = () => (
  <VStack experimental_spaceY={3}>
    <Input name="" placeholder="Type anything..." />
    <Input name="" placeholder="Type anything..." size="sm" />
    <Input name="email" label="With Label" type="email" placeholder="example@domain.com" />
    <Input leftAddon={<SearchIcon />} name="" placeholder="Search..." />
    <Input
      error={{ message: "This email is not valid!" }}
      name="email"
      label="Email"
      placeholder="example@domain.com"
    />
    <Input textarea h={40} name="message" label="Message" placeholder="Message..." />
  </VStack>
);
