import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import Logo from './Logo'

export default function AuthPage() {
  const { t } = useTranslation()
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isLogin && password !== confirmPass) {
      setError(t('auth.passwords_mismatch'))
      return
    }

    setLoading(true)
    try {
      if (isLogin) await login(email, password)
      else await register(email, password)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) setError(t('auth.error_exists'))
      else if (status === 401) setError(t('auth.error_invalid'))
      else setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4"
      style={{ background: 'var(--color-surface-0)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass w-full max-w-sm p-8">

        <div className="flex items-center gap-3 mb-8 justify-center">
          <Logo size={44} />
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            NexusLens
          </span>
        </div>

        <form onSubmit={submit} aria-label={isLogin ? t('auth.login') : t('auth.register')} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('auth.email')}
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
              aria-invalid={error ? true : undefined}
              className="w-full px-4 py-2.5 rounded-lg text-sm input-field" />
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('auth.password')}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} autoComplete={isLogin ? 'current-password' : 'new-password'}
              aria-invalid={error ? true : undefined}
              className="w-full px-4 py-2.5 rounded-lg text-sm input-field" />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                {t('auth.confirm_password')}
              </label>
              <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                required minLength={8} autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg text-sm input-field" />
            </div>
          )}

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-severity-critical)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isLogin ? t('auth.login') : t('auth.register')}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          {isLogin ? t('auth.no_account') : t('auth.has_account')}{' '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPass('') }}
            className="underline" style={{ color: 'var(--color-accent)' }}>
            {isLogin ? t('auth.register') : t('auth.login')}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
