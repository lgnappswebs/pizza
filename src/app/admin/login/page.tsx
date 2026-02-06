
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, LogIn, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, initiateEmailSignIn } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('lgngregorio@icloud.com');
  const [password, setPassword] = useState('Lgn92ltc79');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    initiateEmailSignIn(auth, email, password);
    
    setTimeout(() => {
      if (auth.currentUser) {
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso."
        });
        router.push('/admin/dashboard');
      } else {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Erro de Autenticação",
          description: "Usuário não encontrado ou senha incorreta. Certifique-se de criar este usuário no Console do Firebase."
        });
      }
    }, 2000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/50 relative">
      <Link href="/" className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
        <ArrowLeft className="h-5 w-5" /> Voltar ao Início
      </Link>
      
      <Card className="w-full max-w-md rounded-3xl border-2 shadow-xl mt-12 md:mt-0 bg-white">
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
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <strong>Aviso:</strong> Você deve criar este usuário manualmente no <strong>Console do Firebase &gt; Authentication</strong> para que o login funcione com estas credenciais.
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@pizzapp.com" 
                className="h-12 rounded-xl text-black"
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
                className="h-12 rounded-xl text-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full text-xl font-bold bg-primary text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <LogIn className="mr-2 h-6 w-6" />}
              Entrar no Painel
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
