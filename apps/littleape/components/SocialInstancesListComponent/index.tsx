import LanguageIcon from "../../public/Language.svg"
import PeerTubeIconWhite from "../../public/Peertube-white.svg"
import AvatarIcon from "../../public/Avatar.svg"
import CheckIcon from "../../public/Check-small.svg"
import { SocialPlatform } from "pages/auth/login"
import { useEffect, useState, FC } from "react"
import Icon from "components/Icon"
import Close from '../../public/Close.svg'
import { ModalProps, Spinner, useDisclosure, useToast } from "@chakra-ui/react"
import AtIcon from "../../public/at-sign.svg";
import ServerIcon from "../../public/server.svg";
import LockIcon from "../../public/lock.svg";

type SocialInstancesListComponentProps = {
    logo: JSX.Element
    title: string
    goBack: () => void
}

class SocialPlatformInsatnce {
    constructor(title, usersCount) {
        this.title = title
        this.usersCount = usersCount
    }
    title: string
    usersCount: string
}

const getInstanceList = (title) => {
    if (title == SocialPlatform.MASTODON) {
        return [new SocialPlatformInsatnce("Mastodon.Social", "5K"), new SocialPlatformInsatnce("Mas.to", "6K"), new SocialPlatformInsatnce("Social.Vivaldi.net", "13K"), new SocialPlatformInsatnce("Mstdn.ca", "10K")]
    } else if (title == SocialPlatform.PIXELFED) {
        return [new SocialPlatformInsatnce("Pixelfed.Social", "5K"), new SocialPlatformInsatnce("Pixelfed.de", "6K"), new SocialPlatformInsatnce("Pixelfed.uno", "13K"), new SocialPlatformInsatnce("Gram.Social", "10K")]
    } else if (title == SocialPlatform.MISSKEY) {
        return [new SocialPlatformInsatnce("Misskey.io", "5K"), new SocialPlatformInsatnce("Misskey.Social", "1.1K"), new SocialPlatformInsatnce("Mk.Godspeed.moe", "61"), new SocialPlatformInsatnce("Misskey.id", "1.7K")]
    } else if (title == SocialPlatform.PEERTUBE) {
        return [new SocialPlatformInsatnce("v.basspistol.org", "5K"), new SocialPlatformInsatnce("skeptikon.fr", "6K"), new SocialPlatformInsatnce("Fair.Tube", "13K"), new SocialPlatformInsatnce("Clip.Place", "10K")]
    }
    return []
}

type NewServerModalProps = { onOk: (url: string) => void, onCanel: () => void };
var loginWithNewUrl = false

export const SocialInstancesListComponent = ({ logo, title, goBack }: SocialInstancesListComponentProps) => {
    const {
        isOpen: isPeerTubeLoginFormOpen,
        onOpen: onPeerTubeLoginFormOpen,
        onClose: onPeerTubeLoginFormClose,
    } = useDisclosure();

    const [selectedIndex, setSelectedIndex] = useState(0)
    const [baseLink, setBaseLink] = useState("")
    const [href, setHref] = useState("")
    const [instancesList, setInstancesList] = useState([])
    const [showNewServerModal, setShowNewServerModal] = useState(false)
    const [showPeerTubeLoginForm, setShowPeerTubeLoginForm] = useState(false)

    useEffect(() => {
        if (loginWithNewUrl == true) {
            loginWithNewUrl = false
            handleLogin()
        }
    }, [href, baseLink])

    const updateHrefAndBaseLink = async (list) => {
        if (list.length > 0) {
            if (title == SocialPlatform.MASTODON) {
                const instance = `https://${list[selectedIndex].title}`;
                setHref(`/api/auth/mastodon?instance=${encodeURIComponent(instance)}`)
                setBaseLink(`${list[selectedIndex].title}`)
            } else if (title == SocialPlatform.PIXELFED) {
                const instance = `https://${list[selectedIndex].title}`;
                setHref(`/api/auth/pixelfed?instance=${encodeURIComponent(instance)}`)
                setBaseLink(`${list[selectedIndex].title}`)
            } else if (title == SocialPlatform.MISSKEY) {
                const instance = `https://${list[selectedIndex].title}`;
                setHref(`/api/auth/misskey?instance=${encodeURIComponent(instance)}`)
                setBaseLink(`${list[selectedIndex].title}`)
            } else if (title == SocialPlatform.PEERTUBE) {
                setBaseLink(`${list[selectedIndex].title}`)
            }
        }
    }

    function isValidHttp(url: string): boolean {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function removeHttpPrefix(url: string): string {
        return url.replace(/^https?:\/\//, '');
    }

    const setNewUrlBaseLinkAndHref = (url: string) => {

        var newUrl = ""
        if (isValidHttp(url)) {
            newUrl = removeHttpPrefix(url)
        } else {
            newUrl = url
        }

        if (title == SocialPlatform.MASTODON) {
            const instance = `https://${newUrl}`;
            setHref(`/api/auth/mastodon?instance=${encodeURIComponent(instance)}`)
            setBaseLink(`${newUrl}`)
        } else if (title == SocialPlatform.PIXELFED) {
            const instance = `https://${newUrl}`;
            setHref(`/api/auth/pixelfed?instance=${encodeURIComponent(instance)}`)
            setBaseLink(`${newUrl}`)
        } else if (title == SocialPlatform.MISSKEY) {
            const instance = `https://${newUrl}`;
            setHref(`/api/auth/misskey?instance=${encodeURIComponent(instance)}`)
            setBaseLink(`${newUrl}`)
        } else if (title == SocialPlatform.PEERTUBE) {
            setBaseLink(`${newUrl}`)
        }

    }

    useEffect(() => {
        const fetchList = async () => {
            const list = await getInstanceList(title);
            setInstancesList(list);
            updateHrefAndBaseLink(list)
        };
        fetchList();
    }, [title])

    useEffect(() => {
        updateHrefAndBaseLink(instancesList)
    }, [selectedIndex])


    const handleLogin = () => {
        console.log("Title is : ", title)
        if (title == SocialPlatform.PEERTUBE) {
            setShowPeerTubeLoginForm(true)
            onPeerTubeLoginFormOpen()
        } else {
            window.location.href = href
        }
    }

    const handleClick = (index) => {
        setSelectedIndex(index)
    }

    const handleDifferentServer = () => {
        setShowNewServerModal(true)
    }


    const NewServerModal: FC<NewServerModalProps> = ({ onOk, onCanel }) => {

        const [newUrl, setNewUrl] = useState("")

        return (
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="z-10 absolute w-full h-full bg-black bg-opacity-60" />
                <div
                    className="absolute -translate-y-full z-20 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white text-gray-2 sm:rounded-lg rounded-t-lg w-full sm:max-w-[30%] sm:border border-gray-0"
                >
                    <div className="flex justify-center items-center p-5 relative">
                        <span className="text-black text-bold-12">{"Server URL"}</span>
                        <Icon icon={Close} className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer" onClick={onCanel} />
                    </div>
                    <hr className="border-gray-0 sm:block hidden mb-8" />
                    <span className="text-bold-12 text-gray-2 mx-4 items-center">Please enter the instance server URL:</span>
                    <div className="mx-4 my-4 flex flex-col items-center justify-center border border-black rounded-md py-3 pl-4">

                        <input
                            type="text"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="Server URL"
                            className="w-full border-none outline-none bg-transparent text-regular-16 text-secondary-1-a"
                        />

                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 mt-8 mx-4 mb-4">
                        <button
                            className="h-12 w-full sm:w-1/2 border border-secondary-1-a bg-white-f text-secondary-1-a text-[14px] font-bold rounded-md flex items-center justify-center gap-2 py-2"
                            onClick={onCanel}
                        >
                            Not now
                        </button>

                        <button
                            className={`h-12 w-full sm:w-1/2 border ${newUrl == "" ? "bg-gray-1 border-gray-1" : "bg-secondary-1-a border-black"} text-white-f text-[14px] font-bold rounded-md flex items-center justify-center gap-2 py-2`}
                            onClick={() => onOk(newUrl)}
                            disabled={newUrl == "" ? true : false}
                        >
                            Next
                        </button>
                    </div>

                </div>
            </div>
        )
    }

    return (
        <>
            <div>
                <span className="text-bold-12 text-gray-2">Login With...</span>

                <div className="flex items-center gap-2 mt-2">
                    {logo}
                    <span className="text-semi-bold-32 text-secondary-a-1">{title}</span>
                </div>

                <div className="mt-2 text-gray-2 text-regular-14">
                    Click next to join{" "}
                    <span className="text-bold-14">“{baseLink}”</span>. Or if you want to find a
                    community that matches your interests better, or is local to where you live,
                    choose one from the list below.
                </div>

                <div>
                    {instancesList.length > 0 &&
                        instancesList.map((instance, index) => (
                            <div key={index} className="w-full">
                                <div className={`relative flex items-center sm:px-6 px-4 border-2 mt-4 ${selectedIndex === index ? 'border-secondary-1-a' : 'border-gray-0'} mb-3 rounded-lg`}
                                    onClick={() => {
                                        handleClick(index)
                                    }}>
                                    {
                                        selectedIndex === index && <div className="absolute -top-3 -right-[-18px] rounded-full border-2 border-black bg-primary p-1 items-center">
                                            <CheckIcon className="w-3 h-3 items-center" />
                                        </div>
                                    }

                                    <div className="flex-grow sm:py-4 py-2 rounded-md items-center justify-between cursor-pointer">
                                        <div className="text-secondary-1-a text-left text-bold-14 mb-2">
                                            {instance.title}
                                        </div>
                                        <div className="flex items-center">
                                            <div className="flex items-center mr-6">
                                                <AvatarIcon />
                                                <div className="ml-1 text-regular-12 text-gray-1 items-center">
                                                    {instance.usersCount}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <LanguageIcon />
                                                <div className="ml-1 text-regular-12 text-gray-1 items-center">
                                                    EN
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>

                <div className="flex items-center justify-center text-bold-14 text-secondary-1-a mt-4 cursor-pointer" onClick={handleDifferentServer}>
                    Sign-in with a different server?
                </div>
                <div className="flex gap-2 w-full flex-col-reverse md:flex-row mt-6">
                    <button
                        className="mt-2 w-full h-12 border border-black bg-white-f text-secondary-1-a text-[12px] font-bold rounded-md flex items-center justify-center gap-2 py-2"
                        onClick={goBack}
                    >
                        Back
                    </button>

                    <button
                        className="mt-2 w-full h-12 border border-black bg-primary text-secondary-1-a text-[12px] font-bold rounded-md flex items-center justify-center gap-2 py-2"
                        onClick={handleLogin}
                    >
                        Next
                    </button>
                </div>

                {
                    showNewServerModal && <NewServerModal onOk={(url) => {
                        setShowNewServerModal(false)
                        setNewUrlBaseLinkAndHref(url)
                        loginWithNewUrl = true
                    }

                    } onCanel={() => {
                        setShowNewServerModal(false)
                        loginWithNewUrl = false
                    }
                    } />
                }
            </div>


            {showPeerTubeLoginForm && <PeerTubeLoginForm
                instance={baseLink}
                isOpen={isPeerTubeLoginFormOpen}
                onClose={() => { onPeerTubeLoginFormClose() }}
            />}
        </>

    )
}



type PeerTubeLoginFormProps = { instance: string } & Omit<ModalProps, "children">;

const PeerTubeLoginForm: FC<PeerTubeLoginFormProps> = ({ isOpen, onClose, instance, ...props }) => {
    if (!isOpen) return null;

    const [serviceProvider, setServiceProriver] = useState(instance)
    const [pass, setPass] = useState("")
    const [userName, setUserName] = useState("")
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();


    const isPeerTubeUser = (obj: any): obj is {
        url: string;
        name: string;
        host: string;
        id: number;
        createdAt: string;
        displayName: string;
        updatedAt: string;
        userId: number;
    } => {
        return (
            obj &&
            typeof obj === 'object' &&
            typeof obj.url === 'string' &&
            typeof obj.name === 'string' &&
            typeof obj.host === 'string' &&
            typeof obj.id === 'number' &&
            typeof obj.createdAt === 'string' &&
            typeof obj.displayName === 'string' &&
            typeof obj.updatedAt === 'string' &&
            typeof obj.userId === 'number'
        );
    }

    async function getAccessToken(api: string, client_id: string, client_secret: string, username: string, password: string) {
        const response = await fetch(`${api}/users/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id,
                client_secret,
                grant_type: 'password',
                username,
                password, // automatically URL-encoded
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return (`Error fetching access token: ${JSON.stringify(data)}`);
        }

        return data.access_token;
    }


    async function getUserAccount(api: string, username: string, access_token: string) {
        const response = await fetch(`${api}/accounts/${username}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return `Error fetching user account: ${JSON.stringify(data)}`;
        }

        return data;
    }

    const handleLogin = async () => {
        const instance = `https://${serviceProvider}`;

        const handleRedirect = (path: string) => {
            window.location.href = path
        }

        if (!instance || !/^https?:\/\/[a-zA-Z0-9.-]+$/.test(instance)) {
            handleRedirect(`/auth/login?peertubeerror=${encodeURIComponent("Invalid or missing instance URL")}`);
        }

        try {

            // Register app dynamically
            const registerRes = await fetch(`${instance}/api/v1/oauth-clients/local`);

            if (!registerRes.ok) {
                handleRedirect(`/auth/login?peertubeerror=${encodeURIComponent("App registration failed")}`);
            }

            const { client_id, client_secret } = await registerRes.json();

            const accessToken = await getAccessToken(`${instance}/api/v1`, client_id, client_secret, userName, pass)

            if (accessToken.includes("error")) {
                handleRedirect(`/auth/login?peertubeerror=${encodeURIComponent("Failed to get access token")}`);
            }

            const account = await getUserAccount(`${instance}/api/v1`, userName, accessToken)

            if (isPeerTubeUser(account) === true) {
                handleRedirect(`/auth/login?peertubeuser=${encodeURIComponent(JSON.stringify(account))}`);
            } else {
                handleRedirect(`/auth/login?peertubeerror=${encodeURIComponent("Failed to get user account")}`);
            }

        } catch (err) {
            handleRedirect(`/auth/login?peertubeerror=${encodeURIComponent("Failed to get user account")}`);
        }
    }

    const handleLoginPeerTubeAccount = () => {

        if (isLoading) {
            return
        }

        if (userName == "" || pass == "") {
            toast({
                title: "Please input username and password",
                description: ``,
                status: "error",
                duration: 6000,
                isClosable: true,
            });
            return
        }

        setIsLoading(true)
        handleLogin()
    }

    const goToPeerTubeForRegistration = () => {
        const instance = `https://${serviceProvider}/signup`;

        window.location.href = instance
    }

    return (
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="z-10 absolute w-full h-full bg-black bg-opacity-60" />
            <div
                className="absolute -translate-y-full z-20 top-full left-0 right-0 sm:right-unset sm:top-1/2 sm:left-1/2 transform sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white text-black-0 sm:rounded-lg rounded-t-lg w-full sm:max-w-[28%] sm:border border-gray-0"
            >
                <div className="flex justify-center items-center p-5 relative">
                    <span className="text-black text-bold-12">{"Login With PeerTube"}</span>
                    <Icon icon={Close} className="absolute top-1/2 sm:right-5 right-[unset] left-5 sm:left-[unset] transform -translate-y-1/2 cursor-pointer" onClick={onClose} />
                </div>
                <hr className="border-gray-0 sm:block hidden" />

                <div className="mx-4 my-4">
                    {/* Form */}
                    <div className="my-4">
                        {/* Server Info Section */}
                        <div className="flex items-center mb-4 border-2 border-black rounded-lg p-4">
                            <span className="flex items-center justify-center w-6 h-6 mr-2 rounded">
                                <ServerIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Bsky.Social"
                                value={serviceProvider}
                                onChange={(e) => setServiceProriver(e.target.value)}
                                className="w-full border-none outline-none bg-transparent"
                            />
                        </div>

                        {/* Username/Email Input */}
                        <div className="flex items-center mb-4 border-2 border-black rounded-lg p-4">
                            <span className="flex items-center justify-center w-6 h-6 mr-2 rounded">
                                <AtIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Username"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full border-none outline-none bg-transparent"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="flex items-center border-2 border-black rounded-lg p-4 relative">
                            <span className="flex items-center justify-center w-6 h-6 mr-2 rounded">
                                <LockIcon />
                            </span>
                            <input
                                type="password"
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                placeholder="App password"
                                className="w-full border-none outline-none bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center my-4 justify-center">
                        <span className="text-black text-medium-12 mr-1">{"Don't have an account yet?"}</span>
                        <span className="text-bold-14 text-[#F1680D] cursor-pointer" onClick={goToPeerTubeForRegistration}>{"Register!"}</span>
                    </div>

                    {/* Submit Button */}
                    <button
                        className="mt-2 w-full h-12 border border-black bg-[#F1680D] text-white-f text-[12px] font-bold rounded-md flex items-center justify-center gap-2 py-2"
                        onClick={() => handleLoginPeerTubeAccount()}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" color="#FFF" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <PeerTubeIconWhite />
                                Login With PeerTube
                            </>
                        )}
                    </button>
                </div>


            </div>
        </div>
    )
}