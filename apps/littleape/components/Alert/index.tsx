import { Alert as ChakraAlert, AlertProps } from "@chakra-ui/react";
import { FC } from "react";

export const Alert: FC<AlertProps> = (props) => {
  return (
    <ChakraAlert
      rounded="md"
      _dark={{
        color: props.status === "error" && "red.200",
      }}
      {...props}
    />
  );
};
