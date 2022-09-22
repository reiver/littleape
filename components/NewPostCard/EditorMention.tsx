import {
  Avatar,
  Button,
  chakra,
  Menu,
  MenuList,
  Spinner,
  Text,
} from "@chakra-ui/react";
import TipTapMention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import tippy from "tippy.js";

const MenuItem = chakra(Button, {
  baseStyle: {
    w: "full",
    justifyContent: "flex-start",
    display: "flex",
    rounded: "0",
    fontWeight: "normal",
    experimental_spaceX: 2,
    px: 3,
    py: 2,
  },
});

const MentionList = forwardRef(function Mention(props: any, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
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
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <Menu isOpen>
      <MenuList position="relative">
        {props.loading && !props.items.length && !props.query.length && (
          <MenuItem
            variant="ghost"
            hover={{ bg: "transparent" }}
            _dark={{ _hover: { bg: "transparent" } }}
            cursor="default"
            className="item"
          >
            <Spinner size="xs" mr="2" /> Loading...
          </MenuItem>
        )}
        {(props.query.length || props.items.length) && props.loading ? (
          <Spinner size="xs" mr="2" position="absolute" top={1} right={0} />
        ) : null}
        {props.items.length ? (
          props.items.map((item, index) => (
            <MenuItem
              variant="ghost"
              _hover={{ bg: selectedIndex === index && "light.100" }}
              bg={selectedIndex === index && "light.100"}
              _dark={{
                _hover: {
                  bg: selectedIndex === index && "whiteAlpha.100 !important",
                },
                bg: selectedIndex === index && "whiteAlpha.100 !important",
              }}
              key={index}
              onMouseOver={() => setSelectedIndex(index)}
              onClick={() => selectItem(index)}
            >
              <Avatar size="xs" />
              <Text>{item}</Text>
            </MenuItem>
          ))
        ) : props.query.length ? (
          <MenuItem
            variant="ghost"
            hover={{ bg: "transparent" }}
            _dark={{ _hover: { bg: "transparent" } }}
            cursor="default"
            className="item"
          >
            No result
          </MenuItem>
        ) : null}
      </MenuList>
    </Menu>
  );
});

let component;
const suggestion = {
  items: async ({ query }) => {
    component.updateProps({ loading: true });
    await new Promise((r) => {
      setTimeout(r, 1000);
    });
    component.updateProps({ loading: false });
    return [
      "Lea Thompson",
      "Cyndi Lauper",
      "Tom Cruise",
      "Nariman",
      "Jerry Hall",
      "Joan Collins",
      "Winona Ryder",
      "Christina Applegate",
      "Alyssa Milano",
      "Molly Ringwald",
      "Ally Sheedy",
      "Narixius",
      "Olivia Newton-John",
      "Elton John",
      "Michael J. Fox",
      "Axl Rose",
      "Emilio Estevez",
      "Ralph Macchio",
      "Rob Lowe",
      "Jennifer Grey",
      "Mickey Rourke",
      "John Cusack",
      "Matthew Broderick",
      "Justine Bateman",
      "Lisa Bonet",
    ]
      .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
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

export const UserMention = TipTapMention.configure({
  HTMLAttributes: {
    class: "mention",
  },
  suggestion,
});
