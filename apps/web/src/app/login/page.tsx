"use client";

import { useEffect, useState } from "react";
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
      {/* Full-screen overlay that covers the app shell completely */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        gridTemplateColumns: "1.15fr 1fr",
        minHeight: "100vh",
        background: "var(--bg)",
      }}>
        {/* Left — brand / hero */}
        <div style={{
          background: "var(--fg)",
          color: "var(--bg)",
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Dot-grid background */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(color-mix(in oklab, currentColor 10%, transparent) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: 0.35,
            pointerEvents: "none",
          }} />

          {/* Logo */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: "var(--bg)", color: "var(--fg)",
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400,
            }}>R</div>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, lineHeight: 1.1 }}>Campus Issues</div>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>
                Rishihood University
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div style={{ position: "relative", maxWidth: 500 }}>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(40px, 5vw, 62px)",
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              fontWeight: 400,
              margin: "0 0 24px",
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

          {/* Bottom stats */}
          <div style={{ position: "relative", display: "flex", gap: 32 }}>
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
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          background: "var(--bg)",
        }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: "var(--font-serif)",
                fontSize: 32,
                fontWeight: 400,
                margin: "0 0 8px",
                color: "var(--fg)",
              }}>
                Sign in
              </h2>
              <p style={{ color: "var(--fg-muted)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                Use your university Google account to continue.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: "color-mix(in oklab, var(--danger) 12%, transparent)",
                border: "1px solid color-mix(in oklab, var(--danger) 30%, transparent)",
                color: "var(--danger)",
                fontSize: 13,
                marginBottom: 20,
                lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            {/* Google button */}
            <div style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "20px",
              background: "var(--bg-surface)",
            }}>
              <GoogleSignIn onError={setError} />
            </div>

            {/* Domain hint */}
            <p style={{
              marginTop: 20,
              fontSize: 12,
              color: "var(--fg-subtle)",
              lineHeight: 1.5,
              textAlign: "center",
            }}>
              Only <strong>@rishihood.edu.in</strong> Google accounts are accepted
              <br />(including Rishihood subdomains).
            </p>

            {/* Divider */}
            <div style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              {[
                { icon: "🔒", text: "Your identity is protected — report anonymously if needed" },
                { icon: "📊", text: "Track every issue from submission to resolution" },
                { icon: "🔔", text: "Get notified when your issue is updated" },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, lineHeight: 1.5 }}>{item.icon}</span>
                  <span style={{ fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <style>{`
        @media (max-width: 700px) {
          .login-overlay-grid {
            grid-template-columns: 1fr !important;
          }
          .login-hero {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
