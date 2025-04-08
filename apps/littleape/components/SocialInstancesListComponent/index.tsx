import { SocialPlatform } from "pages/auth/login"
import { useEffect, useState } from "react"
import { string } from "zod"

type SocialInstancesListComponentProps = {
    logo: JSX.Element
    title: string
    goBack: () => void
}

class SocialPlatformInsatnce {
    constructor(title, description) {
        this.title = title
        this.description = description
    }
    title: string
    description: string
}

export const SocialInstancesListComponent = ({ logo, title, goBack }: SocialInstancesListComponentProps) => {

    const [baseLink, setBaseLink] = useState("")
    const [href, setHref] = useState("")
    const [serverUrl, setServerUrl] = useState("")
    const instancesList = [new SocialPlatformInsatnce("test", "test decsription"), new SocialPlatformInsatnce("test", "test decsription"), new SocialPlatformInsatnce("test", "test decsription")]
    const [selectedInstanceIndex, setSelectedInstanceIndex] = useState(0)

    useEffect(() => {
        if (title == SocialPlatform.MASTODON) {
            setHref("/api/auth/mastodon")
            setBaseLink("Mastodon.social")
        } else if (title == SocialPlatform.PIXELFED) {
            setHref("/api/auth/pixelfed")
            setBaseLink("Pixelfed.social")
        } else if (title == SocialPlatform.MISSKEY) {
            setHref("/api/auth/misskey")
            setBaseLink("Misskey.io")
        } else if (title == SocialPlatform.PEERTUBE) {
            setHref("/api/auth/peertube")
            setBaseLink("Kodcast.com")
        }
    }, [title])


    const handleLogin = () => {
        window.location.href = href
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

            <div className="my-6 text-bold-12 text-gray-2 items-center border-1 border-gray-1 rounded-[16px] pl-4 py-2 relative bg-white-f-9">
                <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="Search A Server Or Enter URL"
                    className="w-full border-none outline-none bg-transparent"
                />
            </div>

            <div>
                {instancesList.length > 0 &&
                    instancesList.map((instance, index) => (
                        <div key={index} className="w-full">
                            <hr className="border-gray-0 mx-4 my-1 sm:mx-6 sm:my-1" />
                            <div className="flex items-center sm:px-6 px-4">
                                <div className="flex-grow sm:py-4 py-2 rounded-md flex items-center justify-between cursor-pointer">
                                    <div className="text-gray-3 text-left text-bold-12">
                                        {instance.title}
                                    </div>
                                    <label className="text-right">
                                        <input
                                            type="radio"
                                            name="devices"
                                            id={`file${index}`}
                                            checked={selectedInstanceIndex === index}
                                            onChange={() => setSelectedInstanceIndex(index)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>


            <div className="flex gap-2 w-full flex-col-reverse md:flex-row">

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
