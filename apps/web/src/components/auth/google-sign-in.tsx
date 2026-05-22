"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getHighestRole } from "@/lib/roles";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string },
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function GoogleSignIn({ onError }: { onError: (msg: string) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) {
      onError("Google sign-in is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID).");
      return;
    }

    const init = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            const me = await loginWithGoogle(response.credential);
            const role = getHighestRole(me.roles);
            if (role === "portal_admin") router.push("/portal");
            else if (role === "institution_admin") router.push("/admin/kanban");
            else router.push("/dashboard");
          } catch (err) {
            onError(err instanceof Error ? err.message : "Google sign-in failed.");
          }
        },
      });
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: buttonRef.current.offsetWidth || 340,
        text: "signin_with",
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [loginWithGoogle, onError, router]);

  if (!CLIENT_ID) {
    return (
      <p style={{ fontSize: 13, color: "var(--danger)" }}>
        Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in.
      </p>
    );
  }

  return (
    <div>
      <div ref={buttonRef} style={{ minHeight: 44, width: "100%" }} />
      {!ready && (
        <div style={{
          height: 44,
          borderRadius: 6,
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 13,
          color: "var(--fg-muted)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Loading Google sign-in…
        </div>
      )}
    </div>
  );
}
