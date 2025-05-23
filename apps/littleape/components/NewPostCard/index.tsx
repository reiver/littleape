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
import { BlueSkyApi } from "lib/blueSkyApi";
import { PocketBaseManager } from "lib/pocketBaseManager";
import dynamic from "next/dynamic";
import { FC, useEffect, useRef, useState } from "react";
import { LoginMode, useAuthStore } from "store";
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

export const NewPostCard: FC<BoxProps & { defaultValue?: string }> = ({ defaultValue = "" }) => {
  const user = useAuthStore((state) => state.user);
  const { cache, mutate } = useSWRConfig();
  const editorRef = useRef<{ clearContent: () => void }>();

  const [bskyPost, setBskyPost] = useState("")
  const loginMode = useAuthStore((state) => state.mode)
  const toast = useToast();

  useEffect(() => {
    // Update bskyPost state when defaultValue changes
    if (defaultValue) {
      setBskyPost(defaultValue);
    }
  }, [defaultValue]);


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
    const pbManager = PocketBaseManager.getInstance()
    const bskySession = await pbManager.fetchBlueSkySessionByUserId(user.id.toString())
    const blueSkyApi = BlueSkyApi.getInstance(bskySession.service)

    if (bskyPost == "" || bskyPost == undefined || bskyPost == null) {
      return
    }

    const res = await blueSkyApi.createPost(bskyPost)
    var retryResponse = null

    if (res == undefined || (res != null && res.status == 401)) {

      //resume the session and retry
      const resSessiion = await blueSkyApi.resumeSession(bskySession)
      logger.log("Resumed session: ", resSessiion)

      retryResponse = await blueSkyApi.createPost(bskyPost)

    }

    if ((retryResponse != null && retryResponse.validationStatus != undefined && retryResponse.validationStatus == "valid") || (res != null && res.validationStatus != undefined && res.validationStatus == "valid")) {
      toast({
        title: "Posted to Bluesky!",
        description: ``,
        status: "success",
        duration: 6000,
        isClosable: true,
      });
    }
    else if (retryResponse == null || retryResponse == undefined || (retryResponse != null && retryResponse.toString().includes("Error"))) {
      toast({
        title: "Bluesky session expired!",
        description: `Please Login again via Bluesky to publish posts`,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }



    defaultValue = null
    setBskyPost("")
  }

  const handlePost = async (e) => {
    e.preventDefault()
    //reset link hash
    window.location.hash = "";

    const pbManager = PocketBaseManager.getInstance()
    const bskySession = await pbManager.fetchBlueSkySessionByUserId(user.id.toString())
    const blueSkyApi = BlueSkyApi.getInstance(bskySession.service)

    if (loginMode == LoginMode.BLUESKY || blueSkyApi != null) {
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
