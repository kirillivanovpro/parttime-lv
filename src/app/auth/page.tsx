'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/contexts/LanguageContext';
import Logo from '@/components/Logo';

type AuthMode = 'signin' | 'signup';
type AuthMethod = 'email' | 'phone';

export default function AuthPage() {
  const router = useRouter();
  const { T } = useLang();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [method, setMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) setError(error.message);
      else {
        setSuccess('Check your email to confirm your account.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    }
    setLoading(false);
  }

  async function handlePhoneSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setError(error.message);
    else setOtpSent(true);
    setLoading(false);
  }

  async function handlePhoneVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    if (error) setError(error.message);
    else router.push('/');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a] mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-[#8BC34A] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {T('sign_in')}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-[#8BC34A] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {T('sign_up')}
            </button>
          </div>

          {/* Method toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => { setMethod('email'); setOtpSent(false); setError(''); }}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                method === 'email'
                  ? 'border-[#8BC34A] text-[#8BC34A]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {T('email')}
            </button>
            <button
              onClick={() => { setMethod('phone'); setOtpSent(false); setError(''); }}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                method === 'phone'
                  ? 'border-[#8BC34A] text-[#8BC34A]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {T('phone')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-800 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Email form */}
          {method === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{T('full_name')}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors"
                    placeholder="Jana Bērziņa"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-400 mb-1">{T('email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors"
                  placeholder="jana@example.lv"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{T('password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? T('loading') : mode === 'signin' ? T('sign_in') : T('sign_up')}
              </button>
            </form>
          )}

          {/* Phone form */}
          {method === 'phone' && !otpSent && (
            <form onSubmit={handlePhoneSend} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{T('phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors"
                  placeholder="+37120000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? T('loading') : T('send_otp')}
              </button>
            </form>
          )}

          {method === 'phone' && otpSent && (
            <form onSubmit={handlePhoneVerify} className="space-y-4">
              <p className="text-sm text-gray-400">
                {T('otp_sent')} <span className="text-white font-medium">{phone}</span>
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">{T('verify_otp')}</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors text-center text-xl tracking-widest"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? T('loading') : T('verify_otp')}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(''); }}
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                {T('back')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
