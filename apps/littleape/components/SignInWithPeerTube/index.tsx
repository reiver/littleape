import { isFediverseMvpMode, isMvpMode } from "pages/auth/login";
import PeertubeLogo from "../../public/Peertube.svg";
import { Spinner } from "@chakra-ui/react";
import { useState } from "react";

type Props = {
    onButtonClick: () => void
}

export const PeerTubeLoginButton = ({ onButtonClick }: Props) => {
    const [isLoading, setIsLoading] = useState(false)

    return (
        <>
            {isFediverseMvpMode == true &&
                <button
                    className="mt-2 w-full h-12 border-2 border-black bg-white-f text-secondary-a-1 text-[12px] font-bold rounded-md flex items-center justify-center gap-2 py-2"
                    onClick={
                        () => {
                            onButtonClick()
                            setIsLoading(true)
                        }
                    }
                >
                    {isLoading ? (
                        <>
                            <Spinner size="sm" color="#1A1A1A" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <PeertubeLogo />
                            Login With PeerTube
                        </>
                    )}
                </button>
            }
            {
                isMvpMode == true && <div className="w-14 h-14 rounded-full bg-gray-0 flex items-center justify-center cursor-pointer" onClick={() => {
                    onButtonClick()
                }}>
                    <PeertubeLogo />
                </div>
            }
        </>

    );
}