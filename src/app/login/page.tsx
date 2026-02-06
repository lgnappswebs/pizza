
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, UserPlus, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAuth, initiateEmailSignIn, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const configQuery = useMemoFirebase(() => collection(firestore, 'configuracoes'), [firestore]);
  const { data: configs } = useCollection(configQuery);
  const config = configs?.[0];

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/menu');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    initiateEmailSignIn(auth, email, password);
    
    setTimeout(() => {
      if (auth.currentUser) {
        toast({
          title: "Bem-vindo de volta!",
          description: "Login realizado com sucesso."
        });
        router.push('/menu');
      } else {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Erro ao entrar",
          description: "E-mail ou senha incorretos."
        });
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30 relative">
      <Link href="/" className="absolute top-4 left-4 md:top-4 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
        <ArrowLeft className="h-5 w-5" /> Início
      </Link>
      
      <Card className="w-full max-w-md rounded-3xl border-2 shadow-xl mt-12 md:mt-0 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-primary">
            {config?.restaurantName || 'Entrar'}
          </CardTitle>
          <CardDescription>Acesse sua conta para pedir mais rápido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                className="h-12 rounded-xl text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password" size="sm" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-12 rounded-xl pr-10 text-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full text-xl font-bold bg-primary text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <LogIn className="mr-2 h-6 w-6" />}
              Entrar
            </Button>
          </form>
          
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Ainda não tem uma conta?</p>
            <Link href="/register">
              <Button variant="outline" className="w-full h-12 rounded-full font-bold text-black border-2">
                <UserPlus className="mr-2 h-5 w-5" /> Criar nova conta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
