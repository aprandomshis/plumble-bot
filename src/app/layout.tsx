import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Puble Account Automation Hub | Pumble Bot Manager',
  description: 'Manage your Pumble / Puble chats, groups, auto-responders, auto-reacts, scheduled announcements, and bots.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex min-h-screen overflow-x-hidden antialiased">
        <ToastProvider>
          <div className="flex w-full min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950/90">
              <Header />
              <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
