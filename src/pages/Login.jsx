import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { useAuth } from '../features/auth/useAuth'
import { PATHS } from '../routes/paths'

const inputClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-white/40'

export default function Login() {
  const { login, loginWithGoogle, submitting, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onGoogleLogin = async () => {
    clearError()
    try {
      await loginWithGoogle()
      navigate(location.state?.from?.pathname || PATHS.home, { replace: true })
    } catch {
      // Error is stored in Redux and displayed above the form.
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    clearError()
    try {
      await login(form)
      navigate(location.state?.from?.pathname || PATHS.home, { replace: true })
    } catch {
      
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e1f21] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#252628] p-8">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <LayoutGrid className="h-7 w-7 text-rose-400" />
          <span className="text-2xl font-semibold">Flowboard</span>
        </div>
        <h1 className="mb-6 text-center text-lg text-slate-200">Log in to your account</h1>

        {error && (
          <p className="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <input name="email" type="email" required placeholder="Email"
            value={form.email} onChange={onChange} className={inputClass} />
          <input name="password" type="password" required placeholder="Password"
            value={form.password} onChange={onChange} className={inputClass} />
          <button disabled={submitting}
            className="w-full rounded-lg bg-rose-500 py-2.5 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60">
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          OR
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <button type="button" onClick={onGoogleLogin} disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60">
          <GoogleMark /> Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to={PATHS.signup} onClick={clearError} className="text-rose-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleMark() {
  return <span aria-hidden="true" className="font-bold text-base">G</span>
}
