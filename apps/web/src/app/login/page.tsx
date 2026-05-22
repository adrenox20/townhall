'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { peopleById } from '@/lib/data';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const priya = peopleById['u4'];

  const handleSignIn = () => router.push('/dashboard');

  return (
    <div className="landing">
      {/* Left: art side */}
      <div className="landing-art">
        <div className="landing-grid-bg" />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', color: 'var(--fg)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-serif)', fontSize: 20 }}>R</div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>Campus Issues</div>
            <div style={{ fontSize: 10.5, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rishihood University</div>
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 520 }}>
          <h1 className="landing-h">
            A campus that <em>listens</em>—<br />and actually fixes things.
          </h1>
          <div style={{ marginTop: 22, fontSize: 14, opacity: 0.75, maxWidth: '44ch', lineHeight: 1.55 }}>
            Report what&apos;s broken, upvote what matters, and watch progress in real time. From a flickering streetlight to a frozen Wi-Fi router—one place, one thread.
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <blockquote className="landing-quote">
            &ldquo;Reported a leaking ceiling Friday night. Fixed by Monday lunch. First time campus has felt this responsive.&rdquo;
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar person={priya} size="sm" />
            <div style={{ fontSize: 12.5 }}>
              <div style={{ fontWeight: 500 }}>Priya Sharma</div>
              <div style={{ opacity: 0.6, fontSize: 11 }}>B.Des Year 2</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form side */}
      <div className="landing-form">
        <div className="landing-form-inner">
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: '-0.015em' }}>Sign in</h2>
            <div style={{ color: 'var(--fg-muted)', fontSize: 13, marginTop: 6 }}>Use your university email to continue.</div>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); handleSignIn(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <Field label="University email">
              <Input
                type="email"
                placeholder="you@nst.rishihood.edu.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Field>

            <Button variant="primary" size="lg" type="submit" block iconRight="arrow-right">
              Continue with email
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0', color: 'var(--fg-subtle)', fontSize: 11.5 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <Button variant="outline" size="lg" block onClick={handleSignIn} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.4-1.6 4-5.4 4-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.6 14.5 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.2 0-.6 0-1-.1-1.6H12z"/>
              </svg>
              Sign in with Google
            </Button>

            <Button variant="outline" size="lg" block onClick={handleSignIn} type="button" icon="user">
              Continue as guest (read-only)
            </Button>
          </form>

          <div style={{ marginTop: 22, fontSize: 11.5, color: 'var(--fg-subtle)', lineHeight: 1.5 }}>
            By signing in you agree to the campus IT acceptable use policy. We never share your reports outside the university.
          </div>
        </div>
      </div>
    </div>
  );
}
