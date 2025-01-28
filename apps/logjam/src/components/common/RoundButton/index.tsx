import clsx from 'clsx';
import { ComponentChildren, FunctionalComponent } from 'preact';

export type RoundButtonProps = {
    children: ComponentChildren;
    image: string;
    variant?: 'red' | 'outline' | 'solid' | 'primary' | string;
    class?: string;
    size?: 'lg' | string;
    [key: string]: any;
};

export const RoundButton: FunctionalComponent<RoundButtonProps> = ({
    children,
    image,
    variant,
    class: className,
    size,
    ...props
}) => {
    let variantClasses = '';
    switch (variant) {
        case 'red':
            variantClasses = 'bg-red-distructive hover:bg-red-700 text-white';
            break;
        case 'outline':
            variantClasses =
                'border dark:border-gray-1 border-secondary-1-a border-inset bg-black bg-opacity-0 hover:bg-opacity-5 text-black dark:text-white';
            break;
        case 'solid':
            variantClasses =
                'border dark:bg-white dark:hover:bg-gray-200 dark:text-black bg:text-secondary-1-a bg-black text-white';
            break;

        case 'primary':
            variantClasses = 'border border-gray-1 border-secondary-1-a border-inset bg-primary text-black';
            break;

        default:
            variantClasses = 'bg-blue-500 hover:bg-blue-600 text-white';
    }
    return (
        <div class="flex flex-col items-center">
            <button
                class={clsx(
                    'transition-all flex flex-col items-center justify-center rounded-full w-14 h-14', // Changed rounded style to rounded-full
                    variantClasses,
                    className
                )}
                {...props}
            >
                <img src={image} alt="Button Image" class="w-6 h-6" /> {/* Adjust image size as needed */}
            </button>
            <span class="text-bold-12 mt-2">{children}</span>
        </div>

    );
};
