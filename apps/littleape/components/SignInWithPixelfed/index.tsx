import { isFediverseMvpMode, isMvpMode } from "pages/auth/login";
import PixelfedLogo from "../../public/Pixelfed.svg";
import { Spinner } from "@chakra-ui/react";
import { useState } from "react";


type Props = {
    onButtonClick: () => void
}

export const PixelfedLoginButton = ({ onButtonClick }: Props) => {
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
                            <PixelfedLogo />
                            Login With Pixelfed
                        </>
                    )}
                </button>
            }

            {
                isMvpMode == true && <div className="w-14 h-14 rounded-full bg-gray-0 flex items-center justify-center cursor-pointer" onClick={() => {
                    onButtonClick()
                    // (window.location.href = "/api/auth/pixelfed")
                }}>
                    <PixelfedLogo />
                </div>
            }
        </>

    );
}