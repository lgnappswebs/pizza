["use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, ArrowLeft, Loader2, Eye, EyeOff, MapPin, Phone, User, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth, initiateEmailSignUp, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    number: '',
    neighborhood: '',
    complement: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7,11)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0,2)}) ${value.slice(2,6)}-${value.slice(6,10)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0,2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    
    setFormData({ ...formData, phone: value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro nas senhas",
        description: "As senhas não coincidem."
      });
      return;
    }

    setLoading(true);
    
    try {
      initiateEmailSignUp(auth, formData.email, formData.password);
      
      const checkInterval = setInterval(async () => {
        if (auth.currentUser) {
          clearInterval(checkInterval);
          const user = auth.currentUser;

          await updateProfile(user, { displayName: formData.name });

          const profileData = {
            uid: user.uid,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            number: formData.number,
            neighborhood: formData.neighborhood,
            complement: formData.complement
          };

          setDocumentNonBlocking(doc(firestore, 'users', user.uid), profileData, { merge: true });

          toast({
            title: "Conta criada!",
            description: `Seja bem-vindo, ${formData.name}!`
          });
          router.push('/menu');
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (loading) setLoading(false);
      }, 10000);

    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível criar sua conta."
      });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30 py-20 relative">
      <Link href="/login" className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center text-primary font-bold hover:underline gap-1 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
        <ArrowLeft className="h-5 w-5" /> Voltar ao Login
      </Link>
      
      <Card className="w-full max-w-2xl rounded-3xl border-2 shadow-xl overflow-hidden mt-12 md:mt-0">
        <CardHeader className="text-center bg-primary/5 pb-8 border-b">
          <CardTitle className="text-4xl font-black text-primary">Cadastro</CardTitle>
          <CardDescription className="text-lg">Complete seus dados para facilitar seus pedidos</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleRegister} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                <User className="h-5 w-5 text-primary" /> Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Seu nome" 
                    className="h-12 rounded-xl"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    className="h-12 rounded-xl"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="h-12 rounded-xl"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                <MapPin className="h-5 w-5 text-primary" /> Endereço de Entrega
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Rua / Logradouro</Label>
                  <Input 
                    id="address" 
                    placeholder="Ex: Rua das Flores" 
                    className="h-12 rounded-xl"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input 
                    id="number" 
                    placeholder="123" 
                    className="h-12 rounded-xl"
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input 
                    id="neighborhood" 
                    placeholder="Ex: Centro" 
                    className="h-12 rounded-xl"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="complement">Complemento (Opcional)</Label>
                  <Input 
                    id="complement" 
                    placeholder="Ex: Apartamento 12, Bloco B" 
                    className="h-12 rounded-xl"
                    value={formData.complement}
                    onChange={(e) => setFormData({...formData, complement: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
                <Lock className="h-5 w-5 text-primary" /> Segurança
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="No mínimo 6 caracteres" 
                      className="h-12 rounded-xl pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
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
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Repita a senha" 
                      className="h-12 rounded-xl pr-10"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                      minLength={6}
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-16 rounded-full text-2xl font-black bg-primary shadow-xl shadow-primary/30 transform transition active:scale-95">
              {loading ? <Loader2 className="h-8 w-8 animate-spin mr-2" /> : <UserPlus className="mr-2 h-8 w-8" />}
              Finalizar Cadastro
            </Button>
          </form>
          <p className="text-center mt-8 text-lg text-muted-foreground">
            Já tem uma conta? <Link href="/login" className="text-primary font-bold hover:underline">Faça login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

    