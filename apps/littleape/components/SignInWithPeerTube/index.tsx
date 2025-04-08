import PeertubeLogo from "../../public/Peertube.svg";

type Props = {
    onButtonClick: () => void
}

export const PeerTubeLoginButton = ({ onButtonClick }: Props) => {
    return (
        <div className="w-14 h-14 rounded-full bg-gray-0 flex items-center justify-center cursor-pointer" onClick={() => {
            onButtonClick()
            //(window.location.href = "/api/auth/peertube")
        }}>
            <PeertubeLogo />
        </div>
    );
}