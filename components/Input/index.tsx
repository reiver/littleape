import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input as ChakraInput,
  InputGroup,
  InputLeftAddon,
  InputProps as ChakraInputProps,
  TextareaProps
} from "@chakra-ui/react";
import { forwardRef, ForwardRefRenderFunction, ReactNode } from "react";
import { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";

export type InputProps = ChakraInputProps &
  TextareaProps & {
    leftAddon?: ReactNode;
    name: string;
    textarea?: boolean;
    label?: string;
    error?: Merge<FieldError, FieldErrorsImpl<{}>>;
  };

const InputComponent: ForwardRefRenderFunction<HTMLInputElement, InputProps> = (props, ref) => {
  const { error, textarea, leftAddon, ...rest } = props;
  const isInvalid = !!error;
  return (
    <FormControl isInvalid={isInvalid} role="group" display="flex" flexDirection="column">
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
          {props.label}
        </FormLabel>
      )}
      <InputGroup
        role="group"
        border="1px solid"
        ring={0}
        rounded="lg"
        borderColor="gray.300"
        transform="200ms ease-out all"
        borderWidth="1px"
        borderStyle="solid"
        _dark={{
          borderColor: "gray.600",
          _hover: { bg: "dark.600" },
          _focusWithin: {
            borderColor: "primary.500",
          },
        }}
        _focusWithin={{
          ring: "2px",
          borderColor: "primary.600",
        }}
        {...(isInvalid
          ? {
              borderColor: "red.400 !important",
              _focusWithin: {
                ring: "2px",
                ringColor: "rgba(245,101,101,.6)",
                borderColor: "red.500 !important",
              },
            }
          : {})}
      >
        {leftAddon && <InputLeftAddon _dark={{ bg: "dark.600" }}>{leftAddon}</InputLeftAddon>}
        <ChakraInput
          as={textarea ? "textarea" : "input"}
          borderRadius="10px"
          bg="white"
          px="4"
          py="2"
          border="0"
          textColor="gray.800"
          transform="200ms ease-out all"
          _dark={{
            bg: "dark.500",
            textColor: "gray.50",
            _hover: { bg: "dark.600" },
            _focus: {
              bg: "#393E4F",
            },
          }}
          _focus={{
            ring: "0",
          }}
          _invalid={{
            borderColor: "red.400 !important",
            _focusWithin: {
              ringColor: "red.300",
              borderColor: "red.500 !important",
            },
          }}
          {...rest}
          ref={ref}
        />
      </InputGroup>

      {error && <FormErrorMessage fontSize="sm">{error.message}</FormErrorMessage>}
    </FormControl>
  );
};

export const Input = forwardRef(InputComponent);
