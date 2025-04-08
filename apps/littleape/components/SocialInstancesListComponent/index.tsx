import LanguageIcon from "../../public/Language.svg"
import AvatarIcon from "../../public/Avatar.svg"
import CheckIcon from "../../public/Check-small.svg"
import { SocialPlatform } from "pages/auth/login"
import { useEffect, useState } from "react"

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
        return [new SocialPlatformInsatnce("Video.Voiceover.bar", "5K"), new SocialPlatformInsatnce("Peertube.Laas.fr", "6K"), new SocialPlatformInsatnce("Fair.Tube", "13K"), new SocialPlatformInsatnce("Clip.Place", "10K")]
    }
    return []
}

export const SocialInstancesListComponent = ({ logo, title, goBack }: SocialInstancesListComponentProps) => {

    const [selectedIndex, setSelectedIndex] = useState(0)
    const [baseLink, setBaseLink] = useState("")
    const [href, setHref] = useState("")
    const [instancesList, setInstancesList] = useState([])

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
                const instance = `https://${list[selectedIndex].title}`;
                setHref("/api/auth/peertube")
                setBaseLink(`${list[selectedIndex].title}`)
            }
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
        window.location.href = href
    }

    const handleClick = (index) => {
        setSelectedIndex(index)
    }

    return (
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

            <div className="flex items-center justify-center text-bold-14 text-secondary-1-a mt-4">
                Sign-in with a different server?
            </div>
            <div className="flex gap-2 w-full flex-col-reverse md:flex-row mt-6">
                <button
                    className="mt-2 w-full h-12 border-2 border-black bg-white-f text-secondary-1-a text-[12px] font-bold rounded-md flex items-center justify-center gap-2 py-2"
                    onClick={goBack}
                >
                    Back
                </button>

                <button
                    className="mt-2 w-full h-12 border-2 border-black bg-primary text-secondary-1-a text-[12px] font-bold rounded-md flex items-center justify-center gap-2 py-2"
                    onClick={handleLogin}
                >
                    Next
                </button>
            </div>
        </div>
    )
}
