"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, LogIn, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, initiateEmailSignIn, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('lgngregorio@icloud.com');
  const [password, setPassword] = useState('Lgn92ltc79');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && user) {
      const adminEmails = ['lgngregorio@icloud.com', 'admin@pizzapp.com'];
      if (adminEmails.includes(user.email || '')) {
        router.push('/admin/dashboard');
      }
    }
  }, [user, isUserLoading, router, mounted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userCredential = await initiateEmailSignIn(auth, email, password);
      const adminEmails = ['lgngregorio@icloud.com', 'admin@pizzapp.com'];
      
      if (adminEmails.includes(userCredential.user.email || '')) {
        toast({
          title: "Bem-vindo!",
          description: "Login administrativo realizado com sucesso."
        });
        router.push('/admin/dashboard');
      } else {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Acesso Negado",
          description: "Este e-mail não tem permissões administrativas."
        });
      }
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "E-mail ou senha incorretos. Certifique-se de que o usuário existe no Console do Firebase."
      });
    }
  };

  if (!mounted) return null;

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
          <CardTitle className="text-3xl font-black text-black">Área Restrita</CardTitle>
          <CardDescription className="text-lg font-medium text-muted-foreground">
            Acesso exclusivo para administradores da Pizzaria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 font-medium">
            <strong>Aviso:</strong> O login administrativo só funcionará para e-mails autorizados e cadastrados no Console do Firebase.
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-black">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@pizzapp.com" 
                className="h-12 rounded-xl text-black border-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Senha" className="font-bold text-black">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="h-12 rounded-xl text-black border-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full text-xl font-black bg-primary text-white shadow-lg shadow-primary/20 transform transition active:scale-95">
              {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <LogIn className="mr-2 h-6 w-6" />}
              Entrar no Painel
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground font-medium border-t pt-4 border-dashed">
            Acesso monitorado e seguro via Firebase
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
