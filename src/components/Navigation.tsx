'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Phone, Calendar, BookOpenText, Package, ShoppingCart } from 'lucide-react';

export default function Navigation() {
  const { user, role } = useAuth();
  const { itemCount } = useCart();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 24) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full border-b border-white/10 bg-blue-950/50 px-4 py-3 text-white shadow-lg backdrop-blur-sm transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center"
          aria-label="Ir al inicio de Podomedic"
        >
          <div className="relative h-[3.375rem] w-[82px] sm:h-[3.75rem] sm:w-[101px]">
            <Image
              src="/images/logo.png"
              alt="Logo de Podomedic"
              fill
              priority
              className="object-contain scale-[1.2] object-center"
            />
          </div>
        </Link>
        <div className="hidden md:flex space-x-6">  
          <Link href="/contact" className="flex items-center gap-1 font-semibold text-white/90 transition-colors hover:text-teal-300">
            <Phone className="w-4 h-4" />
            Contacto
          </Link>
          <Link href="/booking" className="flex items-center gap-1 font-semibold text-white/90 transition-colors hover:text-teal-300">
            <Calendar className="w-4 h-4" />
            Reservar Cita
          </Link>
          <Link href="/blog" className="flex items-center gap-1 font-semibold text-white/90 transition-colors hover:text-teal-300">
            <BookOpenText className="w-4 h-4" />
            Blog
          </Link>
          <Link href="/productos" className="flex items-center gap-1 font-semibold text-white/90 transition-colors hover:text-teal-300">
            <Package className="w-4 h-4" />
            Productos
          </Link>
          <Link href="/carrito" className="relative flex items-center gap-1 font-semibold text-white/90 transition-colors hover:text-teal-300">
            <ShoppingCart className="w-4 h-4" />
            Carrito
            {itemCount > 0 && (
              <span className="absolute -right-3 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              {role === 'admin' && <Link href="/admin" className="font-semibold text-white/90 transition-colors hover:text-teal-300">Admin</Link>}
              {role === 'customer' && <Link href="/customer" className="font-semibold text-white/90 transition-colors hover:text-teal-300">Mi Perfil</Link>}
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition-colors font-semibold">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-full bg-white/15 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/25">
              Iniciar Sesión
            </Link>
          )}
        </div>
        {/* Mobile menu - simplified */}
        <div className="md:hidden flex space-x-2">
          <Link href="/carrito" className="relative rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/25">
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-sm font-semibold">
              Salir
            </button>
          ) : (
            <Link href="/login" className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/25">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
