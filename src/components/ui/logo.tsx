'use client';

/**
 * Logo Component
 * Uses mix-blend-mode to truly overlay the fox on any background
 */

import Image from 'next/image';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
    showText?: boolean;
    className?: string;
}

const sizes = {
    sm: { logo: 40, text: 'text-lg font-semibold' },
    md: { logo: 52, text: 'text-xl font-bold' },
    lg: { logo: 64, text: 'text-2xl font-bold' },
    xl: { logo: 80, text: 'text-3xl font-bold' },
    hero: { logo: 100, text: 'text-4xl font-bold' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
    const { logo, text } = sizes[size];

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            {/* 
              mix-blend-mode: multiply makes white backgrounds transparent
              while keeping the colored fox visible on any background
            */}
            <Image
                src="/logo.png"
                alt="IntentLab"
                width={logo}
                height={logo}
                className="flex-shrink-0 object-contain"
                style={{ mixBlendMode: 'multiply' }}
                priority
                unoptimized
            />
            {showText && (
                <span className={`${text} tracking-tight -ml-5`}>
                    IntentLab
                </span>
            )}
        </div>
    );
}
