
import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeInjected } from '@/components/pizzeria/ThemeInjected';

export const metadata: Metadata = {
  title: 'PizzApp Rápido - Pizza Quentinha e Saborosa',
  description: 'O melhor aplicativo para pedir pizza na sua cidade com rapidez e facilidade.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 min-h-screen relative overflow-x-hidden">
        <FirebaseClientProvider>
          <ThemeInjected />
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
