"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, initiateEmailSignUp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      initiateEmailSignUp(auth, email, password);
      
      // Pequeno delay para esperar a criação no Firebase
      setTimeout(async () => {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
          toast({
            title: "Conta criada!",
            description: `Seja bem-vindo, ${name}!`
          });
          router.push('/menu');
        } else {
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description: "Verifique os dados ou tente outro e-mail."
          });
        }
      }, 2000);
    } catch (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar sua conta."
      });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Link href="/login" className="fixed top-8 left-8 flex items-center text-primary font-bold hover:underline gap-1">
        <ArrowLeft className="h-5 w-5" /> Voltar ao Login
      </Link>
      
      <Card className="w-full max-w-md rounded-3xl border-2 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-primary">Cadastro</CardTitle>
          <CardDescription>Crie sua conta para aproveitar promoções</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                placeholder="Como quer ser chamado?" 
                className="h-12 rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
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
                placeholder="No mínimo 6 caracteres" 
                className="h-12 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 rounded-full text-xl font-bold bg-primary">
              {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <UserPlus className="mr-2 h-6 w-6" />}
              Criar Conta
            </Button>
          </form>
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Já tem uma conta? <Link href="/login" className="text-primary font-bold hover:underline">Faça login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
