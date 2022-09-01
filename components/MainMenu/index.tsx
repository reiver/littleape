import { Box, BoxProps, ButtonProps, chakra } from "@chakra-ui/react";
import {
  ChatBubbleBottomCenterTextIcon,
  // SignalIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { Button } from "components/Button";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FC } from "react";

const FeedIcon = chakra(Squares2X2Icon);
// const DiscoverIcon = chakra(SignalIcon);
const MessagesIcon = chakra(ChatBubbleBottomCenterTextIcon);

type MenuItemType = { href: string } & ButtonProps;
const MenuItem: FC<MenuItemType> = ({ href, ...props }) => {
  const router = useRouter();
  const isActive = router.pathname == href;
  return (
    <Link href={href} passHref>
      <Button
        as="a"
        fontWeight={!isActive ? "normal" : "medium"}
        border="0"
        justifyContent="flex-start"
        textAlign="left"
        color="dark.800"
        bg={isActive && "light.50"}
        _hover={{
          bg: "rgba(255,255,255,.5)",
        }}
        _active={{
          bg: "light.50",
        }}
        _dark={{
          color: "light.300",
          bg: isActive && "dark.700",
          _hover: {
            bg: !isActive && "dark.800",
          },
          _active: {
            bg: "dark.700",
          },
        }}
        {...props}
        leftIcon={React.cloneElement(props.leftIcon, {
          strokeWidth: isActive ? "2.2" : "1.7",
        })}
      />
    </Link>
  );
};

export const MainMenu: FC<BoxProps> = (props) => {
  return (
    <Box
      {...props}
      display="flex"
      flexDirection="column"
      experimental_spaceY={3}
    >
      <MenuItem href="/" leftIcon={<FeedIcon w="4" />}>
        Feed
      </MenuItem>
      {/* <MenuItem href="/discover" leftIcon={<DiscoverIcon w="4" />}>
        Discover
      </MenuItem> */}
      <MenuItem href="/messages" leftIcon={<MessagesIcon w="4" />}>
        Direct Message
      </MenuItem>
    </Box>
  );
};
