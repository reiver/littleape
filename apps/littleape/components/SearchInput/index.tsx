import { chakra, Input, InputGroup, InputLeftAddon, InputProps } from "@chakra-ui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { FC } from "react";

const MagnifyIcon = chakra(MagnifyingGlassIcon);

export const SearchInput: FC<InputProps> = () => {
  return (
    <InputGroup
      role="group"
      maxW="lg"
      rounded="full"
      transition="200ms ease-out all"
      bg="light.100"
      border="1px solid"
      borderColor="light.200"
      _focusWithin={{
        ring: "2px",
      }}
      _dark={{
        bg: "dark.800",
        color: "dark.300",
        borderColor: "dark.600",
        _focusWithin: { bg: "dark.900", color: "gray.300" },
      }}
    >
      <InputLeftAddon
        color="gray.500"
        _groupFocusWithin={{
          color: "gray.800",
          _dark: {
            color: "gray.300",
          },
        }}
        h={9}
        bg="transparent"
        border={0}
      >
        <MagnifyIcon w="4" />
      </InputLeftAddon>
      <Input
        fontSize="sm"
        _focus={{ border: 0, ring: 0 }}
        pl={0}
        h={9}
        color="gray.800"
        _dark={{
          color: "gray.300",
        }}
        border={0}
        type="tel"
        placeholder="Search..."
        rounded="full"
        bg={"transparent"}
      />
    </InputGroup>
  );
};
