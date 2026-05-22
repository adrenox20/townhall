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
        width: 320,
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
      <div ref={buttonRef} style={{ minHeight: 44 }} />
      {!ready && (
        <p style={{ fontSize: 12, color: "var(--fg-subtle)", marginTop: 8 }}>Loading Google sign-in…</p>
      )}
    </div>
  );
}
