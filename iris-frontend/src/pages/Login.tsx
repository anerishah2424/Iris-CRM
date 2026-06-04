import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.username, data.password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex w-2/5 bg-matrix-navy flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">IR</span>
            </div>
            <span className="text-white text-2xl font-bold">IRIS</span>
          </div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Intelligent Revenue &<br />Insights for Sales
          </h1>
          <p className="text-matrix-lightBlue text-base mb-10">
            Matrix Comsec's unified sales intelligence portal
          </p>
          <div className="space-y-4">
            {[
              'Zone-scoped account intelligence',
              'AI-powered market analysis',
              'Health score & renewal tracking',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-matrix-cyan flex-shrink-0" />
                <span className="text-white/90 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-px bg-white/10 mb-6" />
          <p className="text-white/40 text-sm">Matrix Comsec © 2026</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-surface px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[400px]"
        >
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-matrix-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IR</span>
            </div>
            <span className="text-xl font-bold text-matrix-navy">IRIS</span>
          </div>

          <h2 className="text-[24px] font-bold text-matrix-navy mb-1">Welcome back</h2>
          <p className="text-sm text-muted mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  {...register('username')}
                  id="login-username"
                  placeholder="Enter your username"
                  className={cn('input pl-9', errors.username && 'border-health-red focus:ring-health-red')}
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="text-[12px] text-health-red mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={cn('input pr-10', errors.password && 'border-health-red focus:ring-health-red')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-health-red mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"
                >
                  <AlertCircle size={15} className="text-health-red flex-shrink-0" />
                  <p className="text-sm text-health-red">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-base"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
