import {
  Box,
  BoxProps,
  ButtonProps,
  Button as ChakraButton,
  FormControl,
  FormErrorMessage,
  Text,
  chakra,
  useToast,
} from "@chakra-ui/react";
import { PhotoIcon as HeroIconPhotoIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { Button } from "components/Button";
import { Card } from "components/Card";
import { Form } from "components/Form";
import { UserAvatar } from "components/UserAvatar";
import { API_OUTBOX, HOST } from "constants/API";
import { useForm } from "hooks/useForm";
import dynamic from "next/dynamic";
import { FC, useRef, useState } from "react";
import { LoginMode, useAuthStore } from "store";
import { useSWRConfig } from "swr";
import { joinURL } from "ufo";
import { z } from "zod";
import { EditorProps } from "./Editor";
import { BlueSkyApi } from "lib/blueSkyApi";

const Editor = dynamic<EditorProps>(() => import("./Editor").then((module) => module.Editor));

const PhotoIcon = chakra(HeroIconPhotoIcon);
const VideoIcon = chakra(VideoCameraIcon);
const blueSkyApi = BlueSkyApi.getInstance()

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

  const [bskyPost, setBskyPost] = useState("")
  const loginMode = useAuthStore((state) => state.mode)
  const toast = useToast();


  const { post, loading, errors, reset, setValue } = useForm(
    API_OUTBOX(user?.username || ''),
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "Note",
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      attributedTo: joinURL(HOST, "/u/", user?.username || ''),
      content: "",
    },
    schema
  );

  const publishToBlueSky = async () => {
    console.log("Publishing to bSKY: ", bskyPost)

    if (bskyPost == "" || bskyPost == undefined || bskyPost == null) {
      return
    }

    const res = await blueSkyApi.createPost(bskyPost)
    if (res != null && res.validationStatus != undefined && res.validationStatus == "valid") {
      toast({
        title: "Posted to Bluesky!",
        description: ``,
        status: "success",
        duration: 6000,
        isClosable: true,
      });
    }

    setBskyPost("")
  }

  const handlePost = async (e) => {
    e.preventDefault()

    if (loginMode == LoginMode.BLUESKY) {
      publishToBlueSky()
    } else {
      toast({
        title: "Login via Bluesky to post content",
        description: ``,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }

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
            username={user?.username || ''}
            name={user?.name || ''}
            src={user?.avatar || ''}
          />
          <FormControl isInvalid={!!errors.content}>
            <input
              onChange={(e) => setBskyPost(e.target.value)}
              value={bskyPost}
              placeholder="Tell your friends about your thoughts"
              className="w-full px-4 py-2 h-12 sm:mb-6 border rounded-md focus:outline-none focus:ring-2 focus:ring-black-400"
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
