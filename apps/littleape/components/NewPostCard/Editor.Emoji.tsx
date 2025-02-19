import { Text } from "@chakra-ui/react";
import Mention from "@tiptap/extension-mention";
import { nameToEmoji } from "gemoji";
import { PluginKey } from "prosemirror-state";
import { suggestionObj } from "./Editor.utils";

const pluginKey = new PluginKey("Emoji");
export const EmojiExtention = Mention.extend({
  name: "emoji",
  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) {
            return false;
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true;
              tr.insertText("", pos, pos + node.nodeSize);

              return false;
            }
          });

          return isMention;
        }),
    };
  },
});

const suggestion = suggestionObj(
  ":",
  pluginKey,
  async ({ query }) => {
    return Object.keys(nameToEmoji)
      .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
  },
  (item) => (
    <>
      <Text>{nameToEmoji[item]}</Text>
      <Text>:{item}:</Text>
    </>
  )
);

export const Emoji = EmojiExtention.configure({
  HTMLAttributes: {
    class: "emoji",
  },
  renderLabel({ node }) {
    return nameToEmoji[node.attrs.id];
  },
  suggestion,
});
