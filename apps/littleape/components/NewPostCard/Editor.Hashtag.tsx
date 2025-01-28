import { Menu, MenuList, Spinner, Text } from "@chakra-ui/react";
import { Editor } from "@tiptap/core";
import { Mark, mergeAttributes, ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "prosemirror-state";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import tippy from "tippy.js";
import { SuggestionItem } from "./Editor.utils";

export const hashtagRegex = new RegExp(`(^|\\s)#(\\w+)`, "mgiu");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    hashtag: {
      setHashtag: () => ReturnType;
      toggleHashtag: () => ReturnType;
      unsetHashtag: () => ReturnType;
    };
  }
}
const pluginKey = new PluginKey("Hashtag");

const MentionList = forwardRef(function Mention(props: any, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item });
      return true;
    }
    return false;
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    return selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        return enterHandler();
      }
      return false;
    },
  }));

  if (!props.loading && props.items.length == 0) return null;
  if (props.items.length)
    return (
      <Menu isOpen>
        <MenuList position="relative">
          {props.items.length && props.loading ? (
            <Spinner size="xs" mr="2" position="absolute" top={1} right={0} />
          ) : null}
          {props.items.length
            ? props.items.map((item, index) => (
                <SuggestionItem
                  variant="ghost"
                  _hover={{
                    bg: selectedIndex === index ? "light.100" : "transparent",
                  }}
                  bg={selectedIndex === index ? "light.100" : "transparent"}
                  _dark={{
                    _hover: {
                      bg: selectedIndex === index ? "whiteAlpha.100 !important" : "transparent",
                    },
                    bg: selectedIndex === index ? "whiteAlpha.100 !important" : "transpreant",
                  }}
                  key={index}
                  onMouseOver={() => setSelectedIndex(index)}
                  onClick={() => selectItem(index)}
                >
                  <Text>#{item}</Text>
                </SuggestionItem>
              ))
            : null}
        </MenuList>
      </Menu>
    );
});

let component;
const suggestion = {
  char: "#",
  pluginKey,
  items: async ({ query }) => {
    // component.updateProps({ loading: true });
    // await new Promise((r) => {
    //   setTimeout(r, 1000);
    // });
    // component.updateProps({ loading: false });
    return ["MahsaAmini", "deadpool3", "BeUnstopable", "Samsung", "Apple", "Hamburg"]
      .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
  },
  command: ({ editor, range, props }) => {
    const nodeAfter = editor.view.state.selection.$to.nodeAfter;
    const overrideSpace = nodeAfter?.text?.startsWith(" ");

    if (overrideSpace) {
      range.to += 1;
    }
    (editor as Editor)
      .chain()
      .focus()
      .insertContentAt(range, "#" + props.id)
      .insertContent(" ")
      .toggleHashtag()
      .run();
    window.getSelection()?.collapseToEnd();
  },
  render: () => {
    let popup;
    return {
      onBeforeStart: (props) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },
      onStart: (props) => {
        component.updateProps(props);
      },
      onBeforeUpdate(props) {
        component.updateProps(props);
      },
      onUpdate(props) {
        component.updateProps(props);
        if (!props.clientRect) {
          return;
        }
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }

        return component.ref?.onKeyDown(props);
      },
      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};

let lastText = "";

const nodesBetween = (from, to, content, f, nodeStart = 0) => {
  for (let i = 0, pos = 0; pos < to; i++) {
    let child = content[i],
      end = pos + child.nodeSize;
    if (
      end > from &&
      f(child, nodeStart + pos, parent || null, i) !== false &&
      child.content.size
    ) {
      let start = pos + 1;
      child.nodesBetween(
        Math.max(0, from - start),
        Math.min(child.content.size, to - start),
        f,
        nodeStart + start
      );
    }
    pos = end;
  }
};
const parseHashtags = (editor: Editor) => {
  const $position = editor.view.state.selection.$from;
  const text = $position.parent.textContent;
  let parentPos = $position.pos - $position.parentOffset;
  if (lastText == text) return;
  lastText = text;

  const matches = text.matchAll(hashtagRegex);
  const chain = editor.chain();
  chain
    .setTextSelection({
      from: parentPos,
      to: parentPos + text.length,
    })
    .unsetHashtag();

  for (const match of [...matches]) {
    const plusOne = match[0].startsWith(" ") ? 1 : 0;
    let nb = 0;
    $position.parent.content.nodesBetween(0, match.index + match[0].length - 2, (node) => {
      if (!node.isText) {
        nb++;
      }
    });

    chain
      .setTextSelection({
        from: nb + parentPos + match.index + plusOne,
        to: nb + parentPos + match.index + match[0].length,
      })
      .setHashtag();
  }
  chain
    .setTextSelection({
      from: $position.pos,
      to: $position.pos,
    })
    .unsetHashtag()
    .run();
};
export const Hashtag = Mark.create({
  name: "hashtag",
  addCommands() {
    return {
      setHashtag:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleHashtag:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetHashtag:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ class: "hashtag" }, HTMLAttributes), 0];
  },
  onUpdate() {
    parseHashtags(this.editor);
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...suggestion,
      }),
    ];
  },
});
