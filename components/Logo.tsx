export function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 72 72"
      width={size}
      height={size}
      style={{ display: "block" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="logoMarkGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#00A758" />
          <stop offset="1" stopColor="#FFED00" />
        </linearGradient>
      </defs>
      <g transform="translate(8 8)">
        <rect x="0" y="0" width="56" height="56" rx="6" fill="#0d0d0d" stroke="url(#logoMarkGrad)" strokeWidth="1.4" />
        <g stroke="#00A758" strokeWidth="2.6" strokeLinecap="round">
          <line x1="12" y1="14" x2="12" y2="42" />
          <line x1="20" y1="14" x2="20" y2="42" />
          <line x1="28" y1="14" x2="28" y2="42" />
          <line x1="36" y1="14" x2="36" y2="42" />
        </g>
        <line x1="44" y1="14" x2="44" y2="42" stroke="#FFED00" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function Logo({ height = 36 }: { height?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 72"
      height={height}
      style={{ display: "block", color: "inherit" }}
      aria-label="otofiltrem.com"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#00A758" />
          <stop offset="1" stopColor="#FFED00" />
        </linearGradient>
      </defs>

      <g transform="translate(8 8)">
        <rect x="0" y="0" width="56" height="56" rx="6" fill="#0d0d0d" stroke="url(#logoGrad)" strokeWidth="1.4" />
        <g stroke="#00A758" strokeWidth="2.6" strokeLinecap="round">
          <line x1="12" y1="14" x2="12" y2="42" />
          <line x1="20" y1="14" x2="20" y2="42" />
          <line x1="28" y1="14" x2="28" y2="42" />
          <line x1="36" y1="14" x2="36" y2="42" />
        </g>
        <line x1="44" y1="14" x2="44" y2="42" stroke="#FFED00" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      <g transform="translate(80 0)" fontFamily="'JetBrains Mono','Fira Code','Consolas',monospace">
        <text x="0" y="44" fontSize="26" fontWeight="700" letterSpacing="-.4" fill="currentColor">
          otofiltrem
        </text>
      </g>
    </svg>
  );
}
