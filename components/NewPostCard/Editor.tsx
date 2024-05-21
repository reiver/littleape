import { BoxProps, chakra } from "@chakra-ui/react";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent as TipTapEditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FC, Ref, useEffect, useImperativeHandle } from "react";
import { Emoji } from "./Editor.Emoji";
import { Hashtag } from "./Editor.Hashtag";
import { UserMention } from "./Editor.Mention";

const EditorContent = chakra(TipTapEditorContent);

export type EditorProps = {
  ref?: any;
  error?: Error;
  editorRef?: Ref<unknown>;
} & BoxProps & { onChange?: (value: string) => void };

export const Editor: FC<EditorProps> = ({ error, editorRef, ...props }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        codeBlock: false,
        horizontalRule: false,
        listItem: false,
        orderedList: false,
        italic: false,
        strike: false,
        code: false,
      }),
      UserMention,
      Emoji,
      Hashtag,
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
    ],
  });
  useImperativeHandle(editorRef, () => ({
    clearContent() {
      editor.commands.clearContent();
    },
  }));
  useEffect(() => {
    if (editor) {
      editor.on("update", () => {
        if (props.onChange) {
          props.onChange(editor.getHTML());
        }
      });
    }
  }, [editor]);

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
      cursor="text"
      border="1px solid"
      ring={0}
      rounded="lg"
      borderColor="gray.300"
      transition="100ms ease-out all"
      borderWidth="1px"
      borderStyle="solid"
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
      }}
      {...props}
    />
  );
};
