import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))" }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))" }} />
        </linearGradient>
      </defs>
      <path
        d="M50 10 C 27.9 10, 10 27.9, 10 50 C 10 72.1, 27.9 90, 50 90 C 72.1 90, 90 72.1, 90 50"
        stroke="url(#logo-gradient)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 35 50 L 50 65 L 65 50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 50 35 V 65"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
