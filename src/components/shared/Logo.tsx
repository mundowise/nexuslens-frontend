import logoSrc from '@/assets/logo.png'

interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 32, className }: Props) {
  return (
    <img src={logoSrc} alt="NexusLens" width={size} height={size}
      className={className} style={{ objectFit: 'contain' }} />
  )
}
