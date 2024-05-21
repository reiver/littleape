import { Button, chakra, Menu, MenuList, Spinner } from "@chakra-ui/react";
import { ReactRenderer } from "@tiptap/react";
import {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import tippy from "tippy.js";

export const SuggestionItem = chakra(Button, {
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
export const MentionList = forwardRef(function Mention(props: any, ref) {
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
          <SuggestionItem
            variant="ghost"
            hover={{ bg: "transparent" }}
            _dark={{ _hover: { bg: "transparent" } }}
            cursor="default"
            className="item"
          >
            <Spinner size="xs" mr="2" /> Loading...
          </SuggestionItem>
        )}
        {(props.query.length || props.items.length) && props.loading ? (
          <Spinner size="xs" mr="2" position="absolute" top={1} right={0} />
        ) : null}
        {props.items.length ? (
          props.items.map((item, index) => (
            <SuggestionItem
              variant="ghost"
              _hover={{
                bg: selectedIndex === index ? "light.100" : "transparent",
              }}
              bg={selectedIndex === index ? "light.100" : "transparent"}
              _dark={{
                _hover: {
                  bg:
                    selectedIndex === index
                      ? "whiteAlpha.100 !important"
                      : "transparent",
                },
                bg:
                  selectedIndex === index
                    ? "whiteAlpha.100 !important"
                    : "transpreant",
              }}
              key={index}
              onMouseOver={() => setSelectedIndex(index)}
              onClick={() => selectItem(index)}
            >
              {props.labelRenderer(item)}
            </SuggestionItem>
          ))
        ) : props.query.length ? (
          <SuggestionItem
            variant="ghost"
            hover={{ bg: "transparent" }}
            _dark={{ _hover: { bg: "transparent" } }}
            cursor="default"
            className="item"
          >
            No result
          </SuggestionItem>
        ) : null}
      </MenuList>
    </Menu>
  );
});

export const suggestionObj = (
  char,
  pluginKey,
  items,
  labelRenderer: (item: string) => ReactNode
) => {
  let component;
  return {
    char,
    pluginKey,
    items: (props) => items({ ...props, component }),
    render: () => {
      let popup;
      return {
        onBeforeStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props: {
              ...props,
              labelRenderer,
            },
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
};
