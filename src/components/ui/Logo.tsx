type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({ size = 40, className }: LogoProps) {
  const ffGrad = "ff_grad";
  const arcGrad = "arc_grad";

  return (
    <div style={{ width: size, height: size }} className={className}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Logo FerkousFlow CRM"
      >
        <defs>
          <linearGradient id={ffGrad} x1="140" y1="180" x2="372" y2="332" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#23D1A6" />
            <stop offset="1" stopColor="#2D6BFF" />
          </linearGradient>

          <linearGradient id={arcGrad} x1="120" y1="90" x2="420" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#23D1A6" />
            <stop offset="1" stopColor="#1B3D9A" />
          </linearGradient>
        </defs>

        <path
          d="M256 92c-91 0-164 73-164 164 0 91 73 164 164 164 62 0 116-34 144-84"
          stroke={`url(#${arcGrad})`}
          strokeWidth="34"
          strokeLinecap="round"
        />

        <path
          d="M170 350V175c0-12 10-22 22-22h78c12 0 22 10 22 22v10c0 12-10 22-22 22h-56v38h46c12 0 22 10 22 22v6c0 12-10 22-22 22h-46v53c0 12-10 22-22 22h-22c-12 0-22-10-22-22z"
          fill={`url(#${ffGrad})`}
        />

        <path
          d="M268 360V160c0-12 10-22 22-22h86c12 0 22 10 22 22v10c0 12-10 22-22 22h-64v45h54c12 0 22 10 22 22v6c0 12-10 22-22 22h-54v71c0 12-10 22-22 22h-22c-12 0-22-10-22-22z"
          fill={`url(#${ffGrad})`}
          opacity="0.95"
        />

        <path d="M330 305h82" stroke={`url(#${ffGrad})`} strokeWidth="18" strokeLinecap="round" />

        <rect x="420" y="288" width="34" height="34" rx="8" stroke={`url(#${ffGrad})`} strokeWidth="10" />
      </svg>
    </div>
  );
}
