export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 400 400" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B7C59" />
          <stop offset="100%" stopColor="#8A9A7A" />
        </linearGradient>
      </defs>
      
      {/* Outer circle */}
      <circle 
        cx="200" 
        cy="200" 
        r="150" 
        fill="none" 
        stroke="url(#logoGradient)" 
        strokeWidth="8"
      />
      
      {/* Middle circle */}
      <circle 
        cx="200" 
        cy="200" 
        r="110" 
        fill="none" 
        stroke="url(#logoGradient)" 
        strokeWidth="6"
      />
      
      {/* Inner circle */}
      <circle 
        cx="200" 
        cy="200" 
        r="70" 
        fill="none" 
        stroke="url(#logoGradient)" 
        strokeWidth="5"
      />
      
      {/* Small inner circle */}
      <circle 
        cx="200" 
        cy="160" 
        r="25" 
        fill="none" 
        stroke="url(#logoGradient)" 
        strokeWidth="4"
      />
      
      {/* Spiral curve connecting elements */}
      <path 
        d="M 200 160 Q 220 180 200 200 Q 180 220 180 250 Q 180 280 210 290" 
        fill="none" 
        stroke="url(#logoGradient)" 
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return <Logo className={className} />
}
