import { BoxProps, chakra } from "@chakra-ui/react";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent as TipTapEditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FC } from "react";
import { UserMention } from "./EditorMention";

const EditorContent = chakra(TipTapEditorContent);

type EditorProps = {
  error?: Error;
} & BoxProps;

export const Editor: FC<EditorProps> = ({ error, ...props }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UserMention,
      Placeholder.configure({
        placeholder: "Write something …",
      }),
    ],
  });

  return (
    <EditorContent
      onClick={() => editor.view.focus()}
      editor={editor}
      display="flex"
      color={error ? "red.400" : "slate.900"}
      _groupFocusWithin={{
        textColor: "slate.800",
      }}
      _invalid={{
        textColor: "red.400 !important",
      }}
      border="1px solid"
      ring={0}
      rounded="lg"
      borderColor="gray.300"
      transition="100ms ease-out all"
      borderWidth="1px"
      borderStyle="solid"
      minH="200px"
      _dark={{
        color: "slate.200",
        _groupFocusWithin: {
          color: "slate.300",
        },
        borderColor: "gray.600",
        _hover: { bg: "dark.800" },
        _focusWithin: {
          borderColor: "primary.500",
        },
      }}
      _focusWithin={{
        ring: "2px",
        borderColor: "primary.600",
      }}
      {...(!!error
        ? {
            borderColor: "red.400 !important",
            _focusWithin: {
              ring: "2px",
              ringColor: "rgba(245,101,101,.6)",
              borderColor: "red.500 !important",
            },
          }
        : {})}
      p={4}
      __css={{
        "& *:focus-visible": {
          outline: "0",
        },
        "& .ProseMirror": {
          h: "auto",
          w: "full",
        },
        "& .ProseMirror p.is-editor-empty:first-child::before": {
          color: "gray",
          content: "attr(data-placeholder)",
          float: "left",
          height: 0,
          pointerEvents: "none",
        },
      }}
      {...props}
    />
  );
};
