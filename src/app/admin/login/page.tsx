
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, LogIn, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would use Firebase Auth
    if (email === 'admin@pizzapp.com' && password === 'admin123') {
      router.push('/admin/dashboard');
    } else {
      alert('Credenciais inválidas. Use admin@pizzapp.com / admin123 para o demo.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <Link href="/" className="fixed top-8 left-8 flex items-center text-primary font-bold hover:underline gap-1">
        <ChevronLeft className="h-5 w-5" /> Voltar ao Início
      </Link>
      
      <Card className="w-full max-w-md rounded-3xl border-2 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black">Área Restrita</CardTitle>
          <CardDescription className="text-lg">
            Acesso exclusivo para administradores da Pizzaria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@pizzapp.com" 
                className="h-12 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="h-12 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-14 rounded-full text-xl font-bold bg-primary">
              <LogIn className="mr-2 h-6 w-6" /> Entrar no Painel
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Acesso monitorado e seguro via Firebase
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
