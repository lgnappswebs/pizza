
"use client"

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useCartStore } from '@/lib/cart-store';

/**
 * Componente invisível que sincroniza o carrinho local com o Firestore
 * quando o usuário está logado, permitindo multi-dispositivo.
 */
export function CartSync() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { items, setItems } = useCartStore();
  const lastPushedItems = useRef<string>('');

  const cartDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid, 'cart', 'current') : null, 
    [firestore, user]
  );

  const { data: remoteCart } = useDoc(cartDocRef);

  // Sincronizar: Local -> Firestore (apenas quando o local mudar)
  useEffect(() => {
    if (!user || !cartDocRef) return;

    const itemsString = JSON.stringify(items);
    if (itemsString !== lastPushedItems.current && itemsString !== JSON.stringify(remoteCart?.items || [])) {
      lastPushedItems.current = itemsString;
      setDocumentNonBlocking(cartDocRef, { items, updatedAt: new Date().toISOString() }, { merge: true });
    }
  }, [items, user, cartDocRef, remoteCart]);

  // Sincronizar: Firestore -> Local (apenas quando o remoto mudar e for diferente do local)
  useEffect(() => {
    if (remoteCart && remoteCart.items) {
      const remoteItemsString = JSON.stringify(remoteCart.items);
      const localItemsString = JSON.stringify(items);
      
      if (remoteItemsString !== localItemsString) {
        setItems(remoteCart.items);
        lastPushedItems.current = remoteItemsString;
      }
    }
  }, [remoteCart, setItems]);

  return null;
}
