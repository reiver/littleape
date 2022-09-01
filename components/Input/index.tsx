import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input as ChakraInput,
  InputProps as ChakraInputProps,
} from "@chakra-ui/react";
import { forwardRef, ForwardRefRenderFunction, HTMLProps } from "react";
import { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

export type InputProps = ChakraInputProps & {
  name: string;
  label?: string;
  error?: Merge<FieldError, FieldErrorsImpl<{}>>;
};

const InputComponent: ForwardRefRenderFunction<HTMLInputElement, InputProps> = (
  props,
  ref
) => {
  const { error, ...rest } = props;
  return (
    <FormControl
      isInvalid={!!error}
      role="group"
      display="flex"
      flexDirection="column"
    >
      {props.name.length > 0 && (
        <FormLabel
          textTransform="capitalize"
          textColor={error ? "red.400" : "slate.600"}
          _groupFocusWithin={{
            textColor: "slate.800",
          }}
          _dark={{
            textColor: "slate.400",
            _groupFocusWithin: {
              textColor: "slate.300",
            },
          }}
          _invalid={{
            textColor: "red.400 !important",
          }}
        >
          {props.label || props.name}
        </FormLabel>
      )}
      <ChakraInput
        rounded="lg"
        border="1px solid"
        borderColor="gray.200"
        bg="light.100"
        px="4"
        py="2"
        textColor="gray.800"
        transform="200ms ease-out all"
        ring={0}
        _dark={{
          bg: "dark.500",
          textColor: "gray.50",
          borderColor: "gray.600",
          _hover: { bg: "dark.600" },
          _focus: {
            borderColor: "primary",
            bg: "#393E4F",
          },
        }}
        _focus={{
          ring: "2px",
          borderColor: "primary",
        }}
        _invalid={{
          borderColor: "red.400 !important",
          _focus: {
            ringColor: "red.300",
            borderColor: "red.500 !important",
          },
        }}
        {...rest}
        ref={ref}
      />

      {error && (
        <FormErrorMessage fontSize="sm">{error.message}</FormErrorMessage>
      )}
    </FormControl>
  );
};

export const Input = forwardRef(InputComponent);
