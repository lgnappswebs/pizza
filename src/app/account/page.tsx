"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/pizzeria/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, MapPin, Loader2, Save as SaveIcon, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    number: '',
    neighborhood: '',
    complement: ''
  });

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: loadingProfile } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        number: userProfile.number || '',
        neighborhood: userProfile.neighborhood || '',
        complement: userProfile.complement || ''
      });
    }
  }, [userProfile]);

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

  const handleSave = () => {
    if (!user) return;
    setLoading(true);

    setDocumentNonBlocking(doc(firestore, 'users', user.uid), formData, { merge: true });

    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Dados atualizados!",
        description: "Suas informações foram salvas com sucesso."
      });
    }, 1000);
  };

  if (isUserLoading || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 relative">
        <Link href="/menu" className="fixed top-32 left-4 md:left-8 flex items-center text-primary font-black hover:underline gap-1 z-50 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full shadow-2xl border-2 border-primary/10 transition-all hover:scale-105 active:scale-95">
          <ArrowLeft className="h-6 w-6" /> Voltar ao Cardápio
        </Link>

        <div className="max-w-3xl mx-auto space-y-10 mt-32 md:mt-28">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 md:h-24 md:w-24 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl md:text-4xl font-black shadow-xl">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Minha Conta</h1>
              <p className="text-xl text-muted-foreground font-medium">{user?.email}</p>
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-black">
                <User className="h-7 w-7 text-primary" /> Perfil e Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-bold text-black">Nome Completo</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="h-14 rounded-2xl text-lg font-bold text-black bg-white border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-lg font-bold text-black">WhatsApp</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="h-14 rounded-2xl text-lg font-bold text-black bg-white border-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-2 shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b p-8">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-black">
                <MapPin className="h-7 w-7 text-primary" /> Meu Endereço Padrão
              </CardTitle>
              <CardDescription className="text-lg font-medium text-muted-foreground">Estes dados serão usados para facilitar sua entrega</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address" className="text-lg font-bold text-black">Rua / Logradouro</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="h-14 rounded-2xl text-lg font-bold text-black bg-white border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-lg font-bold text-black">Número</Label>
                  <Input 
                    id="number" 
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                    className="h-14 rounded-2xl text-lg font-bold text-black bg-white border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="text-lg font-bold text-black">Bairro</Label>
                  <Input 
                    id="neighborhood" 
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    className="h-14 rounded-2xl text-lg font-bold text-black bg-white border-2"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="complement" className="text-lg font-bold text-black">Complemento</Label>
                  <Input 
                    id="complement" 
                    value={formData.complement}
                    onChange={(e) => setFormData({...formData, complement: e.target.value})}
                    className="h-14 rounded-2xl text-lg font-bold text-black bg-white border-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave}
            disabled={loading}
            className="w-full h-20 rounded-full text-2xl font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transform transition hover:scale-[1.02] active:scale-95"
          >
            {loading ? <Loader2 className="h-10 w-10 animate-spin mr-3" /> : <SaveIcon className="mr-3 h-8 w-8" />}
            Salvar Alterações
          </Button>
        </div>
      </main>
    </>
  );
}
