import PeertubeLogo from "../../public/Peertube.svg";


export const PeerTubeLoginButton = () => {
    return (
        <div className="w-14 h-14 rounded-full bg-gray-0 flex items-center justify-center cursor-pointer" onClick={() => (window.location.href = "https://joinpeertube.org/instances")}>
            <PeertubeLogo />
        </div>
    );
}