import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Logo from './Logo'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 1800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: 'var(--color-surface-0)' }}>

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4">

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <Logo size={72} />
            </motion.div>

            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-display)' }}>
              NexusLens
            </motion.h1>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.6, duration: 1, ease: 'easeInOut' }}
              className="h-0.5 rounded-full"
              style={{ background: 'var(--color-accent)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
