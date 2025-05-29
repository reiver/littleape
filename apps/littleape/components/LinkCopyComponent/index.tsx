import Icon from "components/Icon"
import CopyIcon from '../../public/Copy.svg'
import LinkIcon from '../../public/Link.svg'
import logger from '../../lib/logger/logger'
import clsx from 'clsx';

type Props = {
    link: string;
    title?: string;
    className?: string;
};

export const LinkCopyComponent = ({ title, link, className }: Props) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(link).then(() => {
            logger.log("Copied to clipboard");
        }).catch((err) => {
            logger.error("Failed to copy:", err);
        });
    };

    return (
        <div className={clsx("flex flex-col gap-1 w-full max-w-[274px]", className)}>
            {title && <span className="text-bold-12 text-gray-3">{title}</span>}

            <div className="w-full bg-gray-0 px-4 py-2 text-gray-2 flex justify-between rounded-full items-center">
                <Icon icon={LinkIcon} />

                <div className="flex-1 flex gap-2 items-center overflow-hidden min-w-0 mx-2">
                    <span className="text-medium-12 truncate greatape-meeting-link">{link}</span>
                </div>

                <button className="cursor-pointer shrink-0" onClick={copyToClipboard}>
                    <Icon icon={CopyIcon} />
                </button>
            </div>
        </div>

    )
}