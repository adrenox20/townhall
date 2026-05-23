"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { useAuth } from "@/lib/auth";
import { getHighestRole } from "@/lib/roles";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const role = getHighestRole(user.roles);
      if (role === "portal_admin") router.push("/portal");
      else if (role === "institution_admin") router.push("/admin/kanban");
      else router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <>
      <style>{`
        .login-grid {
          position: fixed; inset: 0; z-index: 9999;
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          min-height: 100vh;
          background: var(--bg);
        }
        .login-hero {
          background: var(--fg); color: var(--bg);
          padding: 56px 64px;
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
        }
        .login-form-side {
          display: flex; align-items: center; justify-content: center;
          padding: 40px; background: var(--bg);
        }
        @media (max-width: 820px) {
          .login-grid { grid-template-columns: 1fr; }
          .login-hero { display: none; }
          .login-form-side { padding: 32px 24px; align-items: flex-start; padding-top: 60px; }
        }
        @media (max-width: 480px) {
          .login-form-side { padding: 24px 16px; padding-top: 48px; }
        }
      `}</style>

      <div className="login-grid">
        {/* Left — brand / hero */}
        <div className="login-hero">
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(color-mix(in oklab, currentColor 10%, transparent) 1px, transparent 1px)",
            backgroundSize: "24px 24px", opacity: 0.35, pointerEvents: "none",
          }} />

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: "transparent",
              display: "grid", placeItems: "center",
            }}><img src="/logo.svg" alt="Campus Issues" style={{ width: 36, height: 36, objectFit: 'contain' }} /></div>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, lineHeight: 1.1 }}>Campus Issues</div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>
                Rishihood University
              </div>
            </div>
          </div>

          <div style={{ position: "relative", maxWidth: 500 }}>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(36px, 4.5vw, 62px)",
              lineHeight: 1.02, letterSpacing: "-0.025em",
              fontWeight: 400, margin: "0 0 24px",
            }}>
              A campus that{" "}
              <em style={{ fontStyle: "italic", color: "color-mix(in oklab, var(--bg) 65%, var(--accent))" }}>
                listens
              </em>
              —<br />and actually fixes things.
            </h1>
            <p style={{ fontSize: 15, opacity: 0.7, maxWidth: "42ch", lineHeight: 1.6, margin: 0 }}>
              Report what&apos;s broken, upvote what matters, and watch progress in real time.
            </p>
          </div>

          <div style={{ position: "relative", display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { value: "Real-time", label: "Status updates" },
              { value: "Transparent", label: "Resolution tracking" },
              { value: "Anonymous", label: "Reporting option" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 400 }}>{s.value}</div>
                <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — sign in form */}
        <div className="login-form-side">
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: "var(--font-serif)", fontSize: 32,
                fontWeight: 400, margin: "0 0 8px", color: "var(--fg)",
              }}>Sign in</h2>
              <p style={{ color: "var(--fg-muted)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Use your university Google account to continue.
              </p>
            </div>

            {error && (
              <div style={{
                padding: "12px 14px", borderRadius: 8,
                background: "color-mix(in oklab, var(--danger) 12%, transparent)",
                border: "1px solid color-mix(in oklab, var(--danger) 30%, transparent)",
                color: "var(--danger)", fontSize: 13, marginBottom: 20, lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "20px", background: "var(--bg-surface)" }}>
              <GoogleSignIn onError={setError} />
            </div>

            <p style={{ marginTop: 20, fontSize: 12, color: "var(--fg-subtle)", lineHeight: 1.5, textAlign: "center" }}>
              Only <strong>@rishihood.edu.in</strong> Google accounts are accepted
              <br />(including Rishihood subdomains).
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
