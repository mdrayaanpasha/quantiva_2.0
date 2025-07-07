import React from 'react';

export type IconName =
    | 'TrendingUpIcon'
    | 'TrendingDownIcon'
    | 'ZapIcon'
    | 'AnchorIcon'
    | 'ScaleIcon';

interface IconProps {
    name: IconName;
    className?: string;
}

const Icon: React.FC<IconProps> = ({ name, className }) => {
    const iconPaths: Record<IconName, string> = {
        TrendingUpIcon: 'M2.5 17.5l7-7 4 4 6.5-6.5',
        TrendingDownIcon: 'M2.5 6.5l7 7 4-4 6.5 6.5',
        ZapIcon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
        AnchorIcon: 'M12 22V8M5 12H2a10 10 0 0020 0h-3M12 8a4 4 0 00-4 4v0a4 4 0 004 4v0a4 4 0 004-4v0a4 4 0 00-4-4z',
        ScaleIcon: 'M16 16.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM6 6h12M6 3h12m-3 16.5l3-3-3-3M9 6.5L6 9l3 3'
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={iconPaths[name]}
            />
        </svg>
    );
};

export default Icon;