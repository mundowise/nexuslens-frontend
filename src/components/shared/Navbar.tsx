import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ScanSearch, CalendarClock, Upload, Sun, Moon, LogOut, Globe, Volume2, VolumeX, Trash2, Sparkles } from 'lucide-react'
import { useApp } from '@/stores/app'
import { useAuth } from '@/stores/auth'
import { useDocuments } from '@/stores/documents'
import { cn } from '@/lib/utils'
import { playSound } from '@/services/audio'
import { setAudioEnabled } from '@/services/audio'
import Logo from './Logo'
import type { AppMode } from '@/types'

const modeIcons: Record<AppMode, typeof ScanSearch> = {
  nexus: Sparkles,
  lens: ScanSearch,
  timeline: CalendarClock,
}

export default function Navbar({ onUpload }: { onUpload: () => void }) {
  const { t, i18n } = useTranslation()
  const { mode, setMode, theme, toggleTheme, lang, setLang, audioEnabled, toggleAudio } = useApp()
  const { logout } = useAuth()
  const { clearAllDocuments, documents } = useDocuments()
  const [confirmClear, setConfirmClear] = useState(false)

  const modes: AppMode[] = ['nexus', 'lens', 'timeline']

  const switchMode = (m: AppMode) => {
    playSound('whoosh')
    setMode(m)
  }

  const cycleLang = () => {
    const next = lang === 'es' ? 'en' : 'es'
    setLang(next)
    i18n.changeLanguage(next)
  }

  const handleAudioToggle = () => {
    toggleAudio()
    setAudioEnabled(!audioEnabled)
  }

  return (
    <nav role="navigation" aria-label={t('app.name')}
      className="fixed top-0 left-0 right-0 z-50 glass px-6 py-3 flex items-center justify-between"
      style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>

      <div className="flex items-center gap-3">
        <Logo size={32} />
        <span className="text-lg font-semibold hidden sm:inline"
          style={{ fontFamily: 'var(--font-display)' }}>
          {t('app.name')}
        </span>
      </div>

      <div className="flex items-center gap-1 glass px-1 py-1" style={{ borderRadius: '9999px' }}>
        {modes.map((m) => {
          const Icon = modeIcons[m]
          const active = mode === m
          return (
            <button key={m} onClick={() => switchMode(m)}
              aria-label={t(`nav.${m}`)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all duration-200',
                active ? 'text-white' : 'opacity-50 hover:opacity-80'
              )}
              style={active ? { background: 'var(--color-accent)' } : {}}>
              <Icon size={16} />
              <span className="hidden sm:inline">{t(`nav.${m}`)}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-accent)' }}>
          <Upload size={14} />
          <span className="hidden sm:inline">{t('nav.upload')}</span>
        </button>

        {documents.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-1 glass px-2 py-1" style={{ borderRadius: '9999px' }}>
              <span className="text-xs px-1" style={{ color: 'var(--color-severity-critical)' }}>
                {t('common.confirm_delete')}
              </span>
              <button onClick={async () => { await clearAllDocuments(); setConfirmClear(false); setMode('nexus') }}
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ background: 'var(--color-severity-critical)' }}>
                {t('common.delete')}
              </button>
              <button onClick={() => setConfirmClear(false)}
                className="text-xs px-2 py-0.5 rounded-full btn-ghost">
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="p-2 rounded-full btn-ghost"
              title={t('common.delete')}>
              <Trash2 size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )
        )}

        <button onClick={cycleLang} className="p-2 rounded-full btn-ghost"
          title={lang === 'es' ? 'English' : 'Español'}>
          <Globe size={16} style={{ color: 'var(--color-text-muted)' }} />
        </button>

        <button onClick={handleAudioToggle} className="p-2 rounded-full btn-ghost">
          {audioEnabled
            ? <Volume2 size={16} style={{ color: 'var(--color-text-muted)' }} />
            : <VolumeX size={16} style={{ color: 'var(--color-text-muted)' }} />
          }
        </button>

        <button onClick={toggleTheme} className="p-2 rounded-full btn-ghost">
          {theme === 'dark'
            ? <Sun size={16} style={{ color: 'var(--color-text-muted)' }} />
            : <Moon size={16} style={{ color: 'var(--color-text-muted)' }} />
          }
        </button>

        <button onClick={logout} className="p-2 rounded-full btn-ghost" title={t('nav.logout')}>
          <LogOut size={16} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>
    </nav>
  )
}
