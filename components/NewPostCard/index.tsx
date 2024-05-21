import {
  Box,
  BoxProps,
  Button as ChakraButton,
  ButtonProps,
  chakra,
  FormControl,
  FormErrorMessage,
  Text,
} from "@chakra-ui/react";
import { PhotoIcon as HeroIconPhotoIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { Button } from "components/Button";
import { Card } from "components/Card";
import { Form } from "components/Form";
import { UserAvatar } from "components/UserAvatar";
import { API_OUTBOX, HOST } from "constants/API";
import { useForm } from "hooks/useForm";
import dynamic from "next/dynamic";
import { FC, useRef } from "react";
import { useAuthStore } from "store";
import { useSWRConfig } from "swr";
import { joinURL } from "ufo";
import { z } from "zod";
import { EditorProps } from "./Editor";

const Editor = dynamic<EditorProps>(() => import("./Editor").then((module) => module.Editor));

const PhotoIcon = chakra(HeroIconPhotoIcon);
const VideoIcon = chakra(VideoCameraIcon);

const ActionButton: FC<ButtonProps> = (props) => {
  return (
    <ChakraButton
      _dark={{
        color: "gray.300",
        bg: "dark.600",
        _hover: { bg: "dark.500" },
      }}
      size="sm"
      fontWeight="normal"
      aria-label="Attach image"
      experimental_spaceX={2}
      {...props}
    />
  );
};

const schema = z.object({
  "@context": z.string(),
  type: z.string(),
  to: z.array(z.string()),
  attributedTo: z.string(),
  content: z.string().min(1),
});

export const NewPostCard: FC<BoxProps> = () => {
  const user = useAuthStore((state) => state.user);
  const { cache, mutate } = useSWRConfig();
  const editorRef = useRef<{ clearContent: () => void }>();
  const { post, loading, errors, reset, setValue } = useForm(
    API_OUTBOX(user.username),
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      attributedTo: joinURL(HOST, "/u/", user.username),
      content: "",
    },
    schema
  );
  const handlePost = async (e) => {
    post(e)
      .then(() => {
        reset();
        if (editorRef.current && editorRef.current.clearContent) editorRef.current.clearContent();
      })
      .then(mutate.bind(null, API_OUTBOX(user.username), cache.get(API_OUTBOX(user.username))));
  };
  return (
    <Card>
      <Form onSubmit={handlePost}>
        <Box display="flex" experimental_spaceX={3}>
          <UserAvatar
            w={8}
            h={8}
            mt="1"
            size="sm"
            username={user.username}
            name={user.display_name}
            src={user.avatar}
          />
          <FormControl isInvalid={!!errors.content}>
            <Editor
              onChange={(value) => setValue("content", value)}
              editorRef={editorRef}
              placeholder="Tell your friends about your thoughts"
              rounded="md"
              fontSize="sm"
            />
            {errors.content && <FormErrorMessage>{errors.content.message}</FormErrorMessage>}
          </FormControl>
        </Box>
        <Box
          display="flex"
          justifyContent="space-between"
          mt="4"
          experimental_spaceX={4}
          flexWrap="wrap"
        >
          <Box pl={12} display="flex" experimental_spaceX={4}>
            <ActionButton>
              <PhotoIcon w={4} strokeWidth={1} />
              <Text display={{ base: "none", sm: "block" }}>Photo</Text>
            </ActionButton>
            <ActionButton>
              <VideoIcon w={4} strokeWidth={1} />
              <Text display={{ base: "none", sm: "block" }}>Video</Text>
            </ActionButton>
          </Box>
          <Box flexGrow="1" display="flex" justifyContent="flex-end">
            <Button type="submit" primary size="sm" px={6} isLoading={loading}>
              Toot!
            </Button>
          </Box>
        </Box>
      </Form>
    </Card>
  );
};
