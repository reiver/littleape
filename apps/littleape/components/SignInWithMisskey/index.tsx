import MisskeyLogo from "../../public/MissKey.svg";


export const MisskeyLoginButton = () => {
    return (
        <div className="w-14 h-14 rounded-full bg-gray-0 flex items-center justify-center cursor-pointer" onClick={() => (window.location.href = "/api/auth/misskey")}>
            <MisskeyLogo />
        </div>
    );
}