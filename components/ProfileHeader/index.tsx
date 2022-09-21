import {
  Box,
  BoxProps,
  Button,
  chakra,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Skeleton,
  SkeletonCircle,
  Spinner,
  Text,
  useDisclosure,
  useMediaQuery,
} from "@chakra-ui/react";
import {
  CameraIcon as HeroCameraIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { FileUpload } from "components/FileUpload";
import { Form } from "components/Form";
import { Input } from "components/Input";
import { UserAvatar } from "components/UserAvatar";
import { UserCover } from "components/UserCover";
import {
  API_PROFILE,
  API_USER_FOLLOWERS,
  API_USER_FOLLOWING,
  API_USER_PROFILE,
} from "constants/API";
import { useForm } from "hooks/useForm";
import { isOtherServer } from "lib/isOtherServer";
import { FC, useState } from "react";
import { uploadFile } from "services/http";
import { useAuthStore } from "store";
import useSWR, { useSWRConfig } from "swr";
import { OrderedCollection } from "types/ActivityPub";
import { ActivityUser, User } from "types/User";
import { z } from "zod";

const EditIcon = chakra(PencilIcon);
const CameraIcon = chakra(HeroCameraIcon);

type ProfileHeaderProps = {
  username: string;
} & BoxProps;

export const ProfileHeader: FC<ProfileHeaderProps> = ({
  username,
  ...props
}) => {
  const { data: user } = useSWR<ActivityUser>([
    API_USER_PROFILE(String(username)),
    { activity: true },
  ]);
  const [isLargerThanSM] = useMediaQuery("(min-width: 30em)");
  const {
    isOpen: isEditProfileOpen,
    onOpen: onEditProfileOpen,
    onClose: onEditProfileClose,
  } = useDisclosure();
  const loggedInUser = useAuthStore((state) => state.user);
  return (
    <Box rounded="lg" bg="light.50" p="2" _dark={{ bg: "dark.700" }} {...props}>
      <Skeleton isLoaded={!!user}>
        <UserCover ratio={16 / 6} src={user?.image?.url} />
      </Skeleton>
      <Box
        display="flex"
        flexDirection="column"
        experimental_spaceY={5}
        p={{
          base: "4",
          md: "6",
        }}
        pr={{
          base: "2",
          md: "1",
        }}
      >
        <Box
          mt={{
            base: "-55px",
            md: "-130px",
          }}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <SkeletonCircle
            h={{
              base: "80px",
              md: "180px",
            }}
            w={{
              base: "80px",
              md: "180px",
            }}
            isLoaded={!!user}
          >
            <UserAvatar
              src={user && user?.icon?.url}
              link={false}
              name={user?.name}
              username={username}
              w={{
                base: "80px",
                md: "180px",
              }}
              h={{
                base: "80px",
                md: "180px",
              }}
              borderStyle="solid"
              borderWidth={{
                base: "4px",
                md: "6px",
              }}
              borderColor="light.50"
              _dark={{
                borderStyle: "solid",
                borderWidth: {
                  base: "4px",
                  md: "8px",
                },
                borderColor: "dark.700",
              }}
            />
          </SkeletonCircle>
          <Box display="flex" experimental_spaceX={3}>
            {user && <RemoteFollow user={user} username={username} />}
            {user && loggedInUser?.username === username && (
              <>
                <Button
                  onClick={onEditProfileOpen}
                  size={{
                    base: "sm",
                    md: "md",
                  }}
                  mb={{
                    base: "-10px",
                    md: "20px",
                  }}
                >
                  {isLargerThanSM ? "Edit Profile" : <EditIcon w="3" />}
                </Button>
                <EditProfileModal
                  user={loggedInUser}
                  isOpen={isEditProfileOpen}
                  onClose={onEditProfileClose}
                />
              </>
            )}
          </Box>
        </Box>
        <Box>
          <Skeleton
            maxW={!!!user && "200px"}
            isLoaded={!!user}
            mt={!!!user && "6px"}
            h={!!!user && "30px"}
          >
            <Text
              mt="-4"
              fontWeight="bold"
              fontSize={{
                base: "xl",
                md: "2xl",
              }}
            >
              {user?.name}
            </Text>
          </Skeleton>
          <Text
            fontSize={{
              base: "sm",
              md: "md",
            }}
            _dark={{
              color: "gray.500",
            }}
          >
            {username}
            {!username.includes("@") && "@" + process.env.NEXT_PUBLIC_HANDLE}
          </Text>
        </Box>
        <Skeleton
          h={!!!user && "24px"}
          maxW={!!!user && "350px"}
          isLoaded={!!user}
          w="full"
        >
          <Box fontSize={{ base: "sm", md: "md" }}>
            <Text
              whiteSpace="pre-wrap"
              dangerouslySetInnerHTML={{ __html: user?.summary }}
            />
          </Box>
        </Skeleton>
        <Box
          mt={4}
          display="flex"
          experimental_spaceX={8}
          flexWrap="wrap"
          _dark={{
            color: "gray.500",
          }}
        >
          <FollowList
            urlFetcher={API_USER_FOLLOWING}
            title="Following"
            name="Follows"
            user={user}
            username={username}
          />
          <FollowList
            urlFetcher={API_USER_FOLLOWERS}
            title="Followers"
            name="Followers"
            user={user}
            username={username}
          />
        </Box>
      </Box>
    </Box>
  );
};

type FollowListProps = {
  user: ActivityUser;
  urlFetcher: (username: string) => string;
  title: string;
  name: string;
  username: string;
};

const FollowList: FC<FollowListProps> = ({
  user,
  urlFetcher,
  title,
  name,
  username,
}) => {
  const { data: followList, error } = useSWR<OrderedCollection>(
    user && [urlFetcher(String(username)), { activity: true }]
  );
  const isAnotherServer = isOtherServer(username);
  const trigger = (
    <Link>
      <Text
        as="span"
        mr={2}
        fontWeight={"medium"}
        _dark={{
          color: "gray.100",
        }}
        color="gray.800"
      >
        {followList ? followList.totalItems : error ? 0 : <Spinner size="xs" />}
      </Text>
      {title}
    </Link>
  );
  if (!isAnotherServer) return trigger;
  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <Portal>
        <PopoverContent _dark={{ bg: "dark.700" }}>
          <PopoverArrow />
          <PopoverBody>
            <Text fontWeight="bold">
              {name} from other servers are not displayed
            </Text>
            <Text as="span" display="block">
              Browse more on the{" "}
              <Link color="primary.500" href={user && user.id}>
                original profile
              </Link>
            </Text>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

type RemoteFollowProps = {
  user: ActivityUser;
  username: string;
};

const RemoteFollow: FC<RemoteFollowProps> = ({ user, username }) => {
  const [error, setError] = useState(null);
  const schema = z
    .string()
    .min(1, "Please fill this field")
    .regex(/(.{1,})@(.{1,})\.(.{2,})/gm, "Invalid username!");
  const onFollow = (event) => {
    try {
      schema.parse(event.target.elements["acct"].value);
      setError(null);
    } catch (err) {
      if (Array.isArray(err.issues)) {
        setError(err.issues[0]);
      }
      event.preventDefault();
    }
  };
  const onClose = () => {
    setError(null);
  };
  return (
    <Popover placement="bottom-end" onClose={onClose}>
      <PopoverTrigger>
        <Button
          size={{
            base: "sm",
            md: "md",
          }}
          mb={{
            base: "-10px",
            md: "20px",
          }}
          colorScheme="primary"
        >
          Remote Follow
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent _dark={{ bg: "dark.700", borderColor: "dark.400" }}>
          <PopoverArrow _dark={{ bg: "dark.700 !important" }} />
          <PopoverCloseButton />
          <PopoverBody py="3">
            <Form
              onSubmit={onFollow}
              action={`/u/${username}/follow`}
              method="get"
              experimental_spaceY="3"
              display="flex"
              alignItems="end"
              flexDirection="column"
            >
              <Input
                name="acct"
                label="Your username"
                placeholder="username@domain"
                size="sm"
                error={error}
              />
              <Button size="sm" colorScheme="blue" type="submit">
                Follow
              </Button>
            </Form>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

const profileSchema = z
  .object({
    display_name: z.string(),
    bio: z.string(),
    github: z.string(),
    avatar: z.any(),
    banner: z.any(),
  })
  .partial();

type EditProfileModalProps = {
  user: User;
} & Omit<ModalProps, "children">;

const EditProfileModal: FC<EditProfileModalProps> = ({ user, ...props }) => {
  const { post, errors, register, reset, watch, setValue, loading } = useForm(
    API_PROFILE,
    user,
    profileSchema
  );

  const { mutate } = useSWRConfig();

  const onProfileSelected = (files: File[]) => {
    setValue("avatar", files[0]);
  };
  const onBannerSelected = (files: File[]) => {
    setValue("banner", files[0]);
  };

  const handleProfileEdit = (e) => {
    let v = null;
    post(e, async (values) => {
      const { avatar, banner } = values;
      await Promise.all([
        uploadFile(avatar as File),
        uploadFile(banner as File),
      ]).then(([avatarUrl, bannerUrl]) => {
        if (avatarUrl) values.avatar = avatarUrl;
        if (bannerUrl) values.banner = bannerUrl;
      });
      v = values;
      return values;
    }).then((response) => {
      mutate([API_USER_PROFILE(String(user.username)), { activity: true }]);
      useAuthStore.setState({ user: { ...user, ...v } });
      reset(v);
    });
  };
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent mx="3" _dark={{ bg: "dark.700" }}>
        <Form onSubmit={handleProfileEdit}>
          <ModalHeader
            px={{
              base: "4",
              md: "6",
            }}
          >
            <Text fontSize={{ base: "md", md: "inherit" }}>Edit profile</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            pb={6}
            px={{
              base: "4",
              md: "6",
            }}
          >
            <Box display="flex" flexDirection="column" experimental_spaceY={4}>
              <Box position="relative" zIndex="1" cursor="pointer">
                <FileUpload
                  onDropAccepted={onBannerSelected}
                  accept={{ "image/jpeg": [], "image/png": [] }}
                >
                  <UserCover
                    file={watch("banner") as File}
                    src={user?.banner}
                  />
                  <Box
                    position="absolute"
                    w="full"
                    h="full"
                    top={0}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    _before={{
                      content: '" "',
                      position: "absolute",
                      w: "full",
                      h: "full",
                      zIndex: "1",
                      rounded: "lg",
                      bg: "dark.700",
                      opacity: "0.5",
                    }}
                    color="white"
                  >
                    <CameraIcon w="6" position="relative" zIndex="2" />
                  </Box>
                </FileUpload>
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                experimental_spaceY={5}
                p="4"
                pb={0}
              >
                <Box
                  mt="-100px"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-end"
                  position="relative"
                  zIndex="2"
                  w="fit-content"
                  cursor="pointer"
                >
                  <FileUpload
                    multiple={false}
                    onDropAccepted={onProfileSelected}
                    accept={{ "image/jpeg": [], "image/png": [] }}
                  >
                    <UserAvatar
                      file={
                        typeof File !== "undefined" &&
                        watch("avatar") instanceof File &&
                        (watch("avatar") as File)
                      }
                      src={user.avatar}
                      name={user.display_name}
                      username={user.username}
                      link={false}
                      w="110px"
                      h="110px"
                      _dark={{
                        borderStyle: "solid",
                        borderWidth: {
                          base: "4px",
                        },
                        borderColor: "dark.700",
                      }}
                    />
                    <Box
                      position="absolute"
                      w="full"
                      h="full"
                      top={0}
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      _before={{
                        content: '" "',
                        position: "absolute",
                        w: "full",
                        h: "full",
                        zIndex: "1",
                        rounded: "full",
                        bg: "dark.700",
                        opacity: "0.5",
                      }}
                      color="white"
                    >
                      <CameraIcon w="6" position="relative" zIndex="2" />
                    </Box>
                  </FileUpload>
                </Box>
              </Box>
              <Input
                error={errors.display_name}
                {...register("display_name")}
                label="Display name"
              />
              <Input
                {...register("bio")}
                error={errors.bio}
                textarea
                name="bio"
                rows={5}
                h="unset"
              />
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="primary"
              mr={3}
              type="submit"
              isLoading={loading}
            >
              Save
            </Button>
            <Button onClick={props.onClose}>Cancel</Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
