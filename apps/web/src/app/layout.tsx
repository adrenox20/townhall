import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/shared/providers';
import { AppShell } from '@/components/app-shell/app-shell';

export const metadata: Metadata = {
  title: 'University Grievance Portal',
  description: 'Cloudflare-native university grievance platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
