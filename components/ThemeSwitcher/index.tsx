import { FC } from "react";
import {
  Box,
  BoxProps,
  Button,
  Stack,
  Switch,
  useColorMode,
} from "@chakra-ui/react";

export const ThemeSwitcher: FC<BoxProps> = (props) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box {...props}>
      <Stack align="center" direction="row">
        <Switch
          defaultValue={colorMode === "light" && "checked"}
          onChange={toggleColorMode}
        />
      </Stack>
    </Box>
  );
};
