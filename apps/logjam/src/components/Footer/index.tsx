import { FC } from "preact/compat";

type FooterProps = {
    compact?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;


export const Footer: FC<FooterProps> = ({ compact, ...rest }) => {
    return (
        <div
            className="w-full flex justify-center text-gray-600 text-sm dark:text-gray-400"
            {...rest}
        >
            <div className="flex items-center">
                <p className="ml-2">
                    Powered by{" "}
                    <a
                        href={import.meta.env.VITE_PUBLIC_GREATAPE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black font-bold"
                    >
                        GreatApe
                    </a>
                </p>
            </div>
        </div>
    );
};
