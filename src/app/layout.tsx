
import type {Metadata} from 'next';
import './globals.css';

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
      <body className="font-body antialiased selection:bg-primary/30 min-h-screen">
        <div className="fixed inset-0 bg-food-pattern pointer-events-none z-0"></div>
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
