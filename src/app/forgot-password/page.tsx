
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, initiatePasswordReset } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await initiatePasswordReset(auth, email);
      setSent(true);
      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir a senha."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "E-mail não encontrado ou formato inválido."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30 relative">
      <Link href="/login" className="fixed top-4 left-4 md:top-8 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
        <ArrowLeft className="h-5 w-5" /> Voltar ao Login
      </Link>
      
      <Card className="w-full max-w-md rounded-3xl border-2 shadow-xl mt-12 md:mt-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-primary">Recuperar Senha</CardTitle>
          <CardDescription>Enviaremos um link para você criar uma nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto bg-green-100 p-4 rounded-full w-fit">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-lg">E-mail de recuperação enviado!</p>
                <p className="text-muted-foreground">Confira sua caixa de entrada (e o spam) para o e-mail: <strong>{email}</strong></p>
              </div>
              <Link href="/login">
                <Button className="w-full h-12 rounded-full font-bold bg-primary">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail cadastrado</Label>
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
              <Button type="submit" disabled={loading} className="w-full h-14 rounded-full text-xl font-bold bg-primary">
                {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Mail className="mr-2 h-6 w-6" />}
                Enviar Link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
