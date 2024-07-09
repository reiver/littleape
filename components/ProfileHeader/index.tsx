import {
  Box,
  BoxProps,
  Button,
  Flex,
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
  chakra,
  useDisclosure,
  useMediaQuery
} from "@chakra-ui/react";
import { CameraIcon as HeroCameraIcon, PencilIcon } from "@heroicons/react/24/outline";
import { ConnectWallet, useAddress, useConnectionStatus, useSDK } from "@thirdweb-dev/react";
import { FileUpload } from "components/FileUpload";
import { Form } from "components/Form";
import { Input } from "components/Input";
import { UserAvatar } from "components/UserAvatar";
import { UserCover } from "components/UserCover";
import { v4 as uuidv4 } from 'uuid';

import {
  API_PROFILE,
  API_USER_FOLLOWERS,
  API_USER_FOLLOWING,
  API_USER_PROFILE,
} from "constants/API";
import { useForm } from "hooks/useForm";
import { isOtherServer } from "lib/isOtherServer";
import { EnsData, PocketBaseManager, WalletData } from "lib/pocketBaseManager";
import { lookUpENS } from "lib/resolveens";
import { FC, useEffect, useState } from "react";
import { FETCH_USER_PROFILE } from "services/api";
import { uploadFile } from "services/http";
import { useAuthStore } from "store";
import useSWR, { useSWRConfig } from "swr";
import { OrderedCollection } from "types/ActivityPub";
import { ActivityUser, User } from "types/User";
import { z } from "zod";
import BlackCheckIcon from '../../public/BlackCheck.svg';
import CopyIcon from '../../public/Copy.svg';
import CheckIcon from '../../public/IconFrame.svg';
import { useWallet } from "../Wallet/walletContext";
import styles from "./MyComponent.module.css";

const pbManager = PocketBaseManager.getInstance()
const userModel = pbManager.fetchUser()

const EditIcon = chakra(PencilIcon);
const CameraIcon = chakra(HeroCameraIcon);


type ProfileHeaderProps = {
  username: string;
} & BoxProps;

const copyToClipboard = (address: string) => {
  navigator.clipboard.writeText(address)
};

export const ProfileHeader: FC<ProfileHeaderProps> = ({ username, ...props }) => {
  const [wallets, setWallets] = useState([]);
  const [walletsMap, setWalletsMap] = useState(new Map());

  const { currentlyConnectedWallet, setCurrentlyConnectedWallet } = useWallet();
  const { walletConnected, setWalletConnected } = useWallet();
  const { setOnSignMessage } = useWallet();
  const { walletVerified, setWalletVerified } = useWallet();
  const { walletDataSaved, setWalletDataSaved } = useWallet();
  const { showConnectedWallets, setShowConnectedWallets } = useWallet();
  const { ensVisibiltyUpdated, setEnsVisibiltyUpdated } = useWallet();
  const { verifiedWalletsList, setVerifiedWalletsList } = useWallet();
  const { publicEnsList, setPublicEnsList } = useWallet();
  const { privateEnsList, setPrivateEnsList } = useWallet();

  //add wallet data and ens data in map
  const addWalletWithEnsData = (wallet, ensDataList) => {
    setWalletsMap(prevMap => {
      const newMap = new Map(prevMap);

      // Check if a wallet with the same ID exists in the Map
      for (const [existingWallet, existingEnsList] of newMap.entries()) {
        if (existingWallet.id === wallet.id) {
          // Remove the existing entry
          newMap.delete(existingWallet);
          break; // Exit the loop after removing the entry
        }
      }


      newMap.set(wallet, ensDataList);
      console.log("Updated Map:", newMap); // Debugging line
      return newMap;
    });
  };

  const getEnsListForWallet = (wallet) => {
    return walletsMap.get(wallet);
  };

  useEffect(() => {
    console.log("Updated walletsMap:", walletsMap);
  }, [walletsMap]);

  useEffect(() => {
    console.log("Trigger fetchEnsListOfWallets currently verified wallets list: ", verifiedWalletsList)
    fetchEnsListOfWallets();
    setEnsVisibiltyUpdated(false);
  }, [ensVisibiltyUpdated, verifiedWalletsList])

  const fetchEnsListOfWallets = async () => {
    if (verifiedWalletsList && verifiedWalletsList.length > 0) {
      try {
        // Loop through each wallet in verifiedWalletsList
        for (let index = 0; index < verifiedWalletsList.length; index++) {
          const wallet = verifiedWalletsList[index];

          // Fetch public list
          const publicList = await pbManager.fetchEnsList(wallet.id, true);
          console.log("publicList: ", publicList);

          // Update publicEnsList state
          if (publicList && publicList.length > 0) {
            setPublicEnsList((prevList) => [
              ...prevList,
              ...publicList.map((element) => element.ens),
            ]);
          }

          // Fetch private list
          const privateList = await pbManager.fetchEnsList(wallet.id, false);
          console.log("privateList: ", privateList);

          // Update privateEnsList state
          if (privateList && privateList.length > 0) {
            setPrivateEnsList((prevList) => [
              ...prevList,
              ...privateList.map((element) => element.ens),
            ]);
          }

          addWalletWithEnsData(wallet, publicList);
        }

        // All fetch operations are completed here
        console.log("All fetch operations completed.");
      } catch (error) {
        console.error("Error fetching ENS lists:", error);
      }
    }
  };



  useEffect(() => {
    const fetchWallets = async () => {
      const list = await pbManager.fetchMyWallets(userModel.id);

      if (list.code == undefined) {
        console.log("List is: ", list)

        //show only verified wallets
        if (list.length > 0) {
          list.map((element) => {
            if (element.signature && element.signature !== "" && element.signature !== "N/A") {
              console.log("Verified wallet:", element);
              setVerifiedWalletsList((prevList) => {
                if (prevList.some((el) => el.signature === element.signature)) {
                  return prevList; // Return the previous list if the element already exists
                } else {
                  return [...prevList, element]; // Add the new element if it doesn't exist
                }
              });
            }
          });
        }



        console.log("Wallets List: ", list)
        console.log("Verified Wallets List: ", verifiedWalletsList)

        //get connected wallet
        list.map((element) => {
          if (element.isConnected) {
            setCurrentlyConnectedWallet(element)
            setWalletConnected(true);

            if (element.signature != undefined && element.signature != "" && element.signature != "N/A") {
              setWalletVerified(true);
            }

            //get connected wallet's ens

          }
        });
      }
    };

    if (userModel) {
      fetchWallets();
    }
  }, [walletDataSaved]);

  const { data: user } = useSWR<ActivityUser>(FETCH_USER_PROFILE(username));
  const [isLargerThanSM] = useMediaQuery("(min-width: 30em)");
  const {
    isOpen: isEditProfileOpen,
    onOpen: onEditProfileOpen,
    onClose: onEditProfileClose,
  } = useDisclosure();

  const {
    isOpen: isSignWalletOpen,
    onOpen: onSignWalletOpen,
    onClose: onSignWalletClose,
  } = useDisclosure();

  const loggedInUser = useAuthStore((state) => state.user);


  useEffect(() => {
    console.log("Opening connected wallet: ", showConnectedWallets)

    if (showConnectedWallets) {
      onSignWalletOpen();
    } else {
      onSignWalletClose();
    }
  }, [showConnectedWallets, onSignWalletOpen, onSignWalletClose])

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


                <SignWalletModal
                  user={loggedInUser}
                  isOpen={isSignWalletOpen}
                  onClose={(() => {
                    onSignWalletClose()
                    setShowConnectedWallets(false)
                  })}
                  onSignMessage={(value) => {
                    return setOnSignMessage(value);
                  }}
                />

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
        {walletsMap != null && walletsMap.size > 0 &&
          <Flex wrap="wrap" className={styles.walletBox} padding="2">

            {Array.from(walletsMap.entries()).map(([wallet, ensList], index) => (
              <Box key={wallet.address} width={walletsMap.size > 1 ? "50%" : "100%"}>
                <Flex alignItems="center" justifyContent="space-between">
                  <CheckIcon className={styles.icon} />
                  <Flex direction="column" flex="1">
                    {
                      ensList != null && ensList.length > 0 && ensList.map(ens => (
                        <Text key={`${wallet.address}-${ens.ens}`} className={styles.walletText}>
                          {ens.ens}
                        </Text>
                      ))
                    }
                    <Text className={styles.walletText}>
                      {maskAddress(wallet.address)}
                    </Text>
                  </Flex>

                  <Button
                    onClick={() => copyToClipboard(wallet.address)}
                    className={styles.iconButton}
                  >
                    <CopyIcon className={styles.icon} />
                  </Button>
                </Flex>
              </Box>
            ))}

          </Flex>
        }


        <Skeleton h={!!!user && "24px"} maxW={!!!user && "350px"} isLoaded={!!user} w="full">
          <Box fontSize={{ base: "sm", md: "md" }}>
            <Text whiteSpace="pre-wrap" dangerouslySetInnerHTML={{ __html: user?.summary }} />
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

const maskAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 7)}***${address.slice(-4)}`;
};

const FollowList: FC<FollowListProps> = ({ user, urlFetcher, title, name, username }) => {
  const { data: followList, error } = useSWR<OrderedCollection>(
    user && [null, { activity: true }]//urlFetcher(String(username))
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
            <Text fontWeight="bold">{name} from other servers are not displayed</Text>
            <Text as="span" display="block">
              Browse more on the{" "}
              <Link color="primary.500" href={user && user?.id || ''}>
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

interface SignWalletModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSignMessage: (value: Boolean) => void;
}


const SignWalletModal: FC<SignWalletModalProps> = ({ user, isOpen, onClose, onSignMessage, ...props }) => {
  console.log("Sign wallet modal triggered");
  const address = useAddress();
  const { ensList } = useWallet();
  const { publicEnsList, setPublicEnsList } = useWallet();
  const { privateEnsList, setPrivateEnsList } = useWallet();
  const { isDisplayEnsNames, setIsDisplayEnsNames } = useWallet();
  const { ensVisibiltyUpdated, setEnsVisibiltyUpdated } = useWallet();
  const { walletVerified, setWalletVerified } = useWallet();

  const handleDisplayEnsToggle = (event) => {
    setIsDisplayEnsNames(event.target.checked)
    // setPublicEnsList([])
    // setPrivateEnsList([])
  }

  const handleCheckboxChange = (event, selectedEns) => {
    if (event.target.checked) {
      //add ens to publis list
      setPublicEnsList([...publicEnsList, selectedEns])

      //remove from private list
      setPrivateEnsList(privateEnsList.filter(ens => ens !== selectedEns));

    } else {
      //remove ens from public list
      setPublicEnsList(publicEnsList.filter(ens => ens !== selectedEns));

      //add to private list
      setPrivateEnsList([...privateEnsList, selectedEns])

    }

    console.log("Public ens list: ", publicEnsList)
    console.log("Private ens list: ", privateEnsList)


  };

  const closeSignInModel = async () => {
    onClose();
    setIsDisplayEnsNames(false);

    //check if public ens list is not empty... The update their public visibility in DB
    console.log("PublicENSLIST: ", publicEnsList)
    if (publicEnsList.length > 0) {
      for (const ens of publicEnsList) {
        console.log(ens);
        const visibilityUpdated = await pbManager.updateEnsVisibility(ens, true);
        console.log("Ens Visibility public:", visibilityUpdated);
      }
    }

    console.log("//////////////////////////////////")

    //
    console.log("PrivteENSLIST: ", privateEnsList)

    if (privateEnsList.length > 0) {
      for (const ens of privateEnsList) {
        console.log(ens);
        const visibilityUpdated = await pbManager.updateEnsVisibility(ens, false);
        console.log("Ens Visibility private:", visibilityUpdated);
      }
    }

    setEnsVisibiltyUpdated(true);

  }

  return (
    <Modal isOpen={isOpen} onClose={closeSignInModel} {...props}>
      <ModalOverlay />
      <ModalContent mx="3" _dark={{ bg: "dark.700" }}>
        <Box>
          <ModalHeader
            px={{
              base: "4",
              md: "6",
            }}
          >
            <Text fontSize={{ base: "md", md: "inherit" }}>Wallet Address Verification</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            pb={6}
            px={{
              base: "4",
              md: "6",
            }}
          >
            <Box display="flex" flexDirection="column" experimental_spaceY={4} className={styles.walletVerifyBox}>
              <ConnectWallet theme="light" className={styles.connectButtonLight} />
              <Text className={styles.walletVerifyBoxText}>
                {`Address is:\n${address}`}
              </Text>
            </Box>

            {isDisplayEnsNames &&
              <Box display="flex" flexDirection="column" className={styles.boxMargin}>
                <Text className={styles.walletVerifyBoxText}>ENS Names:</Text>
                {
                  ensList.map((element, index) => (
                    <Box display="flex" className={styles.boxEnsList} alignItems="center" justifyContent="space-between">
                      <Text className={styles.walletVerifyBoxText}>{element}</Text>
                      <label>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          onChange={(event) => {
                            handleCheckboxChange(event, element)
                          }}
                          checked={publicEnsList.includes(element)}
                        />
                      </label>
                    </Box>
                  ))
                }

              </Box>
            }


            {
              ensList.length > 0 && <Box display="flex" className={styles.boxMargin} alignItems="center" justifyContent="space-between">
                <Text className={styles.walletVerifyBoxText}>Display the ENS name</Text>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    onChange={handleDisplayEnsToggle}
                  />
                  <span className={`${styles.slider} ${styles.round}`}></span>
                </label>
              </Box>
            }

          </ModalBody>
          <ModalFooter>
            {
              !walletVerified && (
                <Button
                  size={{
                    base: "sm",
                    md: "md",
                  }}
                  mr={{
                    md: "20px",
                  }}
                  colorScheme="primary"
                  onClick={() => {
                    onSignMessage(true)
                    closeSignInModel();
                  }}>Sign</Button>
              )
            }
            {
              walletVerified ? (<Button
                onClick={closeSignInModel}>Close</Button>) : (<Button onClick={closeSignInModel}>Not now</Button>)
            }

          </ModalFooter>
        </Box>
      </ModalContent>
    </Modal>
  );
};

const EditProfileModal: FC<EditProfileModalProps> = ({ user, ...props }) => {
  const address = useAddress();
  const sdk = useSDK();
  const connectionStatus = useConnectionStatus();

  const { walletConnected, setWalletConnected } = useWallet();
  const { onSignMessage, setOnSignMessage } = useWallet();
  const { walletVerified, setWalletVerified } = useWallet();
  const { showConnectedWallets, setShowConnectedWallets } = useWallet();
  const { currentlyConnectedWallet, setCurrentlyConnectedWallet } = useWallet();
  const { ensList, setEnsList } = useWallet();
  const { privateEnsList, setPrivateEnsList } = useWallet();


  const [messageSigned, setMessageSigned] = useState(false)
  const { walletDataSaved, setWalletDataSaved } = useWallet();
  const [ens, setEns] = useState('');
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('N/A');


  useEffect(() => {
    const run = async () => {
      if (address && walletConnected) {
        console.log("Looking up ens address now")
        await lookUpEnsAddress(address)
      }
    };

    run()
  }, [address, walletConnected])

  useEffect(() => {
    //sign message only if onSignMessage is true
    if (onSignMessage) {
      console.log("onSignMessage: ", onSignMessage)
      createMessageAndSign()
    }
  }, [address, walletConnected, onSignMessage])

  const createMessageAndSign = async () => {
    console.log("Addess: ", address)
    console.log("walletConnected: ", walletConnected)
    console.log("messageSigned: ", messageSigned)
    if (address != undefined && walletConnected && !messageSigned) {
      console.log("Address is : ", address)
      console.log("SDK is: ", sdk.wallet)

      const message = await createMessage()

      //sign message
      await signMessage(`\x19Ethereum Signed Message:\n${message.length}${message}`)
    }
  };

  const createMessage = async () => {
    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + 30 * 60000);
    const notBefore = new Date(currentDate.getTime() + 10 * 60000);
    const randomUUID = uuidv4();

    const loginOptions = {
      "Version": "1",
      "ChainId": "1",
      "Nonce": randomUUID,
      "Issued At": currentDate.toISOString(),
      "Expiration Time": expirationDate.toISOString(),
      "Not Before": notBefore.toISOString(),
    };

    const objectToString = (obj) => {
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }

    const messageText = `${window.location.host} wants you to sign in with your Ethereum account:\n${address}\n\nPlease ensure that the domain above matches the URL of the current website.\n\n${objectToString(loginOptions)}`;

    return messageText

  }


  const signMessage = async (message) => {
    console.log("MESAAGE:", message)

    try {
      const sig = await sdk?.wallet?.sign(message);

      if (!sig) {
        throw new Error('Failed to sign message');
      }

      setMessageSigned(true)
      setMessage(message)
      setSignature(sig);

    } catch (error) {
      console.log("Error while signing: ", error)
      setMessageSigned(false)
      setOnSignMessage(false)
    }


  }


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

  const lookUpEnsAddress = async (address) => {
    const resolvedName = await lookUpENS(address);
    console.log("resolvedName: ", resolvedName)
    if (resolvedName != null) {
      setEns(resolvedName);

      if (ensList) {
        setEnsList([...ensList, resolvedName]);
      } else {
        setEnsList([resolvedName]);
      }

      if (privateEnsList) {
        setPrivateEnsList(...privateEnsList, resolvedName)
      } else {
        setPrivateEnsList(resolvedName)
      }
    } else {
      console.log("No ENS FOUND")
      setEns('Wallet Address could not be resolved');
      setEnsList(["dummy.eth", "myens.eth", "abcdef.eth"]) //dummy ens list
    }

    return resolvedName
  }

  const handleProfileEdit = (e) => {
    let v = null;
    post(e, async (values) => {
      const { avatar, banner } = values;
      await Promise.all([uploadFile(avatar as File), uploadFile(banner as File)]).then(
        ([avatarUrl, bannerUrl]) => {
          if (avatarUrl) values.avatar = avatarUrl;
          if (bannerUrl) values.banner = bannerUrl;
        }
      );
      v = values;
      return values;
    }).then((response) => {
      mutate([API_USER_PROFILE(String(user?.username || '')), { activity: true }]);
      useAuthStore.setState({ user: { ...user, ...v } });
      reset(v);
    });
  };

  useEffect(() => {
    const checkWalletStatus = async () => {
      if (connectionStatus === "disconnected") {
        setWalletConnected(false)
        setWalletDataSaved(false)
        setSignature(null)
        setMessageSigned(false)
        setMessage(null)
        setOnSignMessage(false);
        setShowConnectedWallets(false)

        //update wallet connection status in DB
        if (currentlyConnectedWallet) {
          console.log("Disconnected wallet address: ", currentlyConnectedWallet)

          const res = await pbManager.updateWalletConnectionStatus(currentlyConnectedWallet.id, false)
          console.log("Wallet status updated: ", res)

          setCurrentlyConnectedWallet(null)
        }
      }
    }

    const fetchData = async () => {
      console.log("Fetching Data...");
      if (walletConnected && messageSigned && address && signature && message && !walletDataSaved) {
        try {
          // Lookup ENS
          var resolvedName = await lookUpEnsAddress(address)

          // Save connected wallet to DB
          const savedWallet = await pbManager.getWallet(address)

          const walletData = new WalletData(savedWallet.id, address, userModel.id, message, signature, true);
          const res = await pbManager.updateWallet(walletData);

          //save ens linked to wallet
          for (const ens of ensList) {
            const ensData = new EnsData(null, ens, savedWallet.id, false);
            const ensSaved = await pbManager.saveEns(ensData);
            console.log("Saved ens: ", ensSaved);
          }


          setCurrentlyConnectedWallet(res);
          console.log('Wallet data saved: ', res);
          if (res !== undefined) {
            setWalletDataSaved(true);
            setOnSignMessage(false);
            setWalletVerified(true);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    fetchData();
    checkWalletStatus();
  }, [walletConnected, address, userModel.id, messageSigned, signature]);


  useEffect(() => {
    const updateWalletStatusUponConnection = async () => {
      if (walletConnected && address) {
        //update wallet connection status based on wallet address
        const wallFound = await pbManager.getWallet(address)
        if (wallFound.code != undefined && wallFound.code == 404) {
          //save wallet to db, without verification
          const walletData = new WalletData(null, address, userModel.id, null, null, true)
          const newWalletSaved = await pbManager.saveWallet(walletData)
          console.log("newWalletSaved: ", newWalletSaved)
        } else {
          const walletStatusUpdated = await pbManager.updateWalletConnectionStatus(wallFound.id, true)
          console.log("Wallet connection status Updated on Connection:", walletStatusUpdated)
          setCurrentlyConnectedWallet(walletStatusUpdated)
        }

      }
    }

    if (walletConnected && address) {
      updateWalletStatusUponConnection()
    }
  }, [walletConnected, address])



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
                  <UserCover file={watch("banner") as File} src={user?.banner} />
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
              <Box display="flex" flexDirection="column" experimental_spaceY={5} p="4" pb={0}>
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
                      src={user?.avatar || ''}
                      name={user?.display_name || ''}
                      username={user?.username || ''}
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

              <Box
                className={styles.connectButton}
                border={"2px"}
                alignContent="center"
                borderColor={"#1A1A1A"}
                borderRadius="4px"
              >

                {
                  walletConnected && !walletVerified ? (
                    // Show some text when wallet is connected but currentlyConnectedWallet is null
                    <Flex alignItems="center" cursor="pointer" onClick={() => setShowConnectedWallets(true)}>
                      <BlackCheckIcon className={styles.blackIcon} />
                      <Text className={styles.textBold11}>
                        Verify Your Wallet Address
                      </Text>
                    </Flex>
                  ) : currentlyConnectedWallet != null && walletConnected && walletVerified ? (
                    // Show verified wallet address text field
                    <Flex alignItems="center" cursor="pointer" onClick={() => setShowConnectedWallets(true)}>
                      <BlackCheckIcon className={styles.blackIcon} />
                      <Text className={styles.textBold11}>
                        Your Wallet Address Is Verified
                      </Text>
                    </Flex>
                  ) : !walletConnected ? (
                    // Show ConnectWallet component when wallet is not connected
                    <Flex alignItems="center" cursor="pointer">
                      <BlackCheckIcon className={styles.blackIcon} />
                      <ConnectWallet
                        theme="light"
                        className={styles.connectButton}
                        auth={{ loginOptional: false }}
                        btnTitle="Verify Your Wallet Address"
                        showThirdwebBranding={false}
                        onConnect={async (wallet) => {
                          console.log("connected to", wallet);
                          setWalletConnected(true);
                          setShowConnectedWallets(true);
                        }}
                      />
                    </Flex>

                  ) : null // Handle any other conditions if necessary
                }

              </Box>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="primary" mr={3} type="submit" isLoading={loading}>
              Save
            </Button>
            <Button onClick={props.onClose}>Cancel</Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};

