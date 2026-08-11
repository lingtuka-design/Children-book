export function HeroScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdeeff" />
          <stop offset="100%" stopColor="#f3ecdb" />
        </linearGradient>
        <linearGradient id="hero-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#ff9e4a" />
        </linearGradient>
      </defs>

      {/* sky */}
      <rect width="400" height="300" rx="28" fill="url(#hero-sky)" />

      {/* sun */}
      <circle cx="330" cy="58" r="30" fill="#ffd166" opacity="0.35" />
      <circle cx="330" cy="58" r="22" fill="url(#hero-sun)" />

      {/* clouds */}
      <g fill="#ffffff" opacity="0.95">
        <ellipse cx="70" cy="52" rx="26" ry="13" />
        <ellipse cx="95" cy="44" rx="20" ry="11" />
        <ellipse cx="118" cy="52" rx="22" ry="12" />
        <ellipse cx="220" cy="95" rx="22" ry="11" />
        <ellipse cx="242" cy="89" rx="16" ry="9" />
      </g>

      {/* hills */}
      <ellipse cx="110" cy="320" rx="200" ry="80" fill="#8fce7a" />
      <ellipse cx="330" cy="330" rx="220" ry="95" fill="#6fb85f" />

      {/* tree */}
      <rect x="52" y="168" width="10" height="44" rx="4" fill="#9c6b3f" />
      <circle cx="57" cy="152" r="26" fill="#5aa84e" />
      <circle cx="44" cy="168" r="16" fill="#6fc062" />

      {/* open book */}
      <g>
        <path
          d="M96 196 L196 178 L296 196 L296 236 L196 218 L96 236 Z"
          fill="#ffffff"
          stroke="#d9c9ae"
          strokeWidth="3"
        />
        <path d="M196 178 L196 218" stroke="#d9c9ae" strokeWidth="3" />
        <path
          d="M112 201 L180 190 M112 210 L180 199 M220 193 L288 202 M220 202 L288 211"
          stroke="#ffb38a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>

      {/* kid */}
      <circle cx="150" cy="236" r="9" fill="#ffd9b8" />
      <path d="M141 232 Q150 226 159 232" fill="#7a4a21" />
      <path
        d="M150 244 Q140 266 148 282 M150 244 Q160 266 152 282"
        stroke="#7a4a21"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="150" cy="258" r="13" fill="#ff7a59" />

      {/* stars */}
      <path d="M20 120 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4 z" fill="#f5b84a" opacity="0.9" />
      <path d="M330 150 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="#f5b84a" opacity="0.8" />
      <path d="M258 40 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="#8b7ec8" opacity="0.85" />
    </svg>
  );
}
