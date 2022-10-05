import { Avatar, Text } from "@chakra-ui/react";
import TipTapMention, { MentionPluginKey } from "@tiptap/extension-mention";
import { suggestionObj } from "./Editor.utils";

const suggestion = suggestionObj(
  "@",
  MentionPluginKey,
  async ({ query, component }) => {
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
  (item) => (
    <>
      <Avatar size="xs" />
      <Text>{item}</Text>
    </>
  )
);
export const UserMention = TipTapMention.configure({
  HTMLAttributes: {
    class: "mention",
  },
  suggestion,
});
