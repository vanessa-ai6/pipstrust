import Image from 'next/image'
import Link from 'next/link'

const LOGO_ICON_SRC = '/pipso.png'

const sizes = {
  md: { icon: 'h-10 w-10', text: 'text-xl' },   // navbar
  sm: { icon: 'h-8 w-8', text: 'text-lg' },     // sidebar / footer
} as const

interface LogoProps {
  href?: string
  size?: keyof typeof sizes
  /** false = icon only (e.g. a collapsed sidebar) */
  showText?: boolean
  className?: string
}

export default function Logo({ href = '/', size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizes[size]
  return (
    <Link href={href} aria-label="PipsTrust home" className={`flex items-center gap-px ${className}`}>
      <Image
        src={LOGO_ICON_SRC}
        alt=""
        width={166}
        height={166}
        priority
        className={`${s.icon} shrink-0 -translate-y-px object-contain`}
      />
      {showText && (
        <span className={`font-display font-bold text-white ${s.text}`}>
          Pips<span className="text-[#01d08d]">Trust</span>
        </span>
      )}
    </Link>
  )
}
