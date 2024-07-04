import { ButtonProps as ChakraButtonProps, Button as ChakraButton } from "@chakra-ui/react";
import { forwardRef, ForwardRefRenderFunction } from "react";

type ButtonProps = {
  primary?: boolean;
} & ChakraButtonProps;

const ButtonComponent: ForwardRefRenderFunction<HTMLButtonElement, ButtonProps> = (props, ref) => {
  const { primary, ...rest } = props;
  return (
    <ChakraButton
      ref={ref}
      variant={primary ? "solid" : "outline"}
      colorScheme={primary ? "primary" : undefined}
      {...rest}
    />
  );
};

export const Button = forwardRef(ButtonComponent);
