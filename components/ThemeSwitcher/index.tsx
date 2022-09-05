import {
  Box,
  BoxProps,
  chakra,
  IconButton,
  Switch,
  useColorMode,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { FC } from "react";

type ThemeSwitcherProps = {
  button: boolean;
} & BoxProps;

const DarkIcon = chakra(MoonIcon, { baseStyle: { w: "12px" } });
const LightIcon = chakra(SunIcon, { baseStyle: { w: "12px" } });

export const ThemeSwitcher: FC<ThemeSwitcherProps> = (props) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box {...props}>
      {props.button ? (
        <IconButton
          size="sm"
          aria-label="Theme switch"
          onClick={toggleColorMode}
          bg="light.50"
          _dark={{
            bg: "dark.700",
            _hover: {
              bg: "dark.600",
            },
          }}
        >
          {colorMode === "dark" ? <DarkIcon /> : <LightIcon />}
        </IconButton>
      ) : (
        <Switch
          defaultValue={colorMode === "light" && "checked"}
          onChange={toggleColorMode}
        />
      )}
    </Box>
  );
};
