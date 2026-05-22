"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { useAuth } from "@/lib/auth";
import { getHighestRole } from "@/lib/roles";
import { formatAllowedDomainsHint } from "@/lib/allowed-domains";

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
    <div className="landing">
      <div className="landing-art">
        <div className="landing-grid-bg" />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg)", color: "var(--fg)", display: "grid", placeItems: "center", fontFamily: "var(--font-serif)", fontSize: 20 }}>R</div>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Campus Issues</div>
            <div style={{ fontSize: 10.5, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>Rishihood University</div>
          </div>
        </div>
        <div style={{ position: "relative", maxWidth: 520 }}>
          <h1 className="landing-h">
            A campus that <em>listens</em>—<br />and actually fixes things.
          </h1>
          <div style={{ marginTop: 22, fontSize: 14, opacity: 0.75, maxWidth: "44ch", lineHeight: 1.55 }}>
            Report what&apos;s broken, upvote what matters, and watch progress in real time.
          </div>
        </div>
      </div>

      <div className="landing-form">
        <div className="landing-form-inner">
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, margin: 0 }}>Sign in</h2>
            <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 6 }}>
              Use your university Google account to continue.
            </div>
          </div>

          {error && (
            <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <GoogleSignIn onError={setError} />

          <div style={{ marginTop: 22, fontSize: 11.5, color: "var(--fg-subtle)", lineHeight: 1.5 }}>
            Only {formatAllowedDomainsHint()} Google accounts are accepted (including Rishihood subdomains).
          </div>
        </div>
      </div>
    </div>
  );
}
