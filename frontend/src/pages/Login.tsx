import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Mail, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, endpoints, setToken } from '../lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement | null, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

const ALLOWED_DOMAIN = 'rishihood.edu.in';

function isValidUniversityEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return false;
  const domain = trimmed.split('@')[1];
  return domain === ALLOWED_DOMAIN || domain.endsWith(`.${ALLOWED_DOMAIN}`);
}

export function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [devLink, setDevLink] = useState<string | undefined>();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const mutation = useMutation({
    mutationFn: endpoints.requestMagicLink,
    onSuccess: (data) => {
      setDevLink(data.devLink);
      setEmailError('');
      toast.success('Magic link sent! Check your inbox.');
    },
    onError: (error) => {
      setEmailError(error.message);
      toast.error(error.message);
    }
  });
  const googleMutation = useMutation({
    mutationFn: (credential: string) => api<{ token: string }>('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
    onSuccess: async (data) => {
      setToken(data.token);
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Signed in with Google');
      navigate('/');
      window.location.reload();
    },
    onError: (error) => toast.error(error.message)
  });

  useEffect(() => {
    if (!googleClientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => googleMutation.mutate(response.credential)
      });
      window.google?.accounts.id.renderButton(document.getElementById('google-signin'), {
        theme: 'filled_black',
        size: 'large',
        width: 352,
        text: 'signin_with'
      });
    };
    document.body.appendChild(script);
    return () => script.remove();
  }, [googleClientId]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setEmailError('');
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('Please enter your email address.'); return; }
    if (!isValidUniversityEmail(trimmed)) {
      setEmailError(`Please use your @${ALLOWED_DOMAIN} or subdomain email.`);
      return;
    }
    mutation.mutate(trimmed);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Sign in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Use your <strong className="text-slate-200">@rishihood.edu.in</strong> email
          </p>
        </div>

        <form onSubmit={submit} className="panel p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">University email</label>
            <input
              className={`field ${emailError ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              placeholder="name@nst.rishihood.edu.in"
              required
            />
            {emailError && (
              <p className="mt-2 text-xs font-medium text-red-400">{emailError}</p>
            )}
          </div>

          <button className="btn-primary w-full" disabled={mutation.isPending}>
            <Mail size={16} />
            {mutation.isPending ? 'Sending...' : 'Send magic link'}
          </button>

          {googleClientId && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
                <div className="relative flex justify-center"><span className="px-3 bg-[#1a1d2e] text-xs text-slate-500">or</span></div>
              </div>
              <div id="google-signin" className="flex justify-center" />
            </>
          )}

          {devLink && (
            <a className="block rounded-lg bg-indigo-600/10 border border-indigo-500/30 p-3 text-sm font-medium text-indigo-300 text-center hover:bg-indigo-600/20 transition-colors" href={devLink}>
              Dev login link →
            </a>
          )}
        </form>
      </div>
    </div>
  );
}
