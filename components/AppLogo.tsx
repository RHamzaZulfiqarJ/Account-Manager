import Image from "next/image";

type AppLogoProps = {
    size?: "sm" | "md" | "lg";
    className?: string;
};

const sizes = {
    sm: {
        box: "h-8 w-8",
        image: "h-6 w-6",
        width: 24,
        height: 24,
    },
    md: {
        box: "h-10 w-10",
        image: "h-7 w-7",
        width: 28,
        height: 28,
    },
    lg: {
        box: "h-12 w-12",
        image: "h-9 w-9",
        width: 36,
        height: 36,
    },
};

export default function AppLogo({ size = "md", className = "" }: AppLogoProps) {
    const selectedSize = sizes[size];

    return (
        <span
            className={`flex ${selectedSize.box} items-center justify-center overflow-hidden rounded-full border border-[var(--chronos-line-strong)] bg-[var(--chronos-olive)]/10 shadow-[0_18px_70px_var(--chronos-glow)] ${className}`}
        >
            <Image
                src="/logo.png"
                alt="MIMICO Logo"
                width={selectedSize.width}
                height={selectedSize.height}
                className={`${selectedSize.image} object-contain`}
                priority
            />
        </span>
    );
}
