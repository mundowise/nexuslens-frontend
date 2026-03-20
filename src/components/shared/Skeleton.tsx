import { cn } from '@/lib/utils'

interface Props {
  className?: string
  count?: number
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg', className)}
      style={{ background: 'var(--color-fill-subtle)' }} />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonLine className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-3 w-3/4" />
          <SkeletonLine className="h-2 w-1/2" />
        </div>
      </div>
      <SkeletonLine className="h-2 w-full" />
      <SkeletonLine className="h-2 w-2/3" />
    </div>
  )
}

export function SkeletonList({ count = 4 }: Props) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
