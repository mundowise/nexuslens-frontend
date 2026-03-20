import { useState, useEffect } from 'react'
import { useApp } from '@/stores/app'
import Navbar from './Navbar'
import UploadModal from './UploadModal'
import ParticleBackground from './ParticleBackground'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme } = useApp()
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light')
    } else {
      document.body.classList.remove('light')
    }
  }, [theme])

  return (
    <>
      <ParticleBackground />
      <Navbar onUpload={() => setUploadOpen(true)} />
      <main className="pt-16 flex-1 flex flex-col">
        {children}
      </main>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  )
}
