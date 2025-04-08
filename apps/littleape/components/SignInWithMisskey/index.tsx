import MisskeyLogo from "../../public/MissKey.svg";

type Props = {
    onButtonClick: () => void
}
export const MisskeyLoginButton = ({ onButtonClick }: Props) => {
    return (
        <div className="w-14 h-14 rounded-full bg-gray-0 flex items-center justify-center cursor-pointer" onClick={() => {
            onButtonClick()
            //window.location.href = "/api/auth/misskey"
        }}>
            <MisskeyLogo />
        </div>
    );
}