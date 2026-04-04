'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBackOffice = pathname.startsWith('/admin') || pathname.startsWith('/customer');

  return (
    <>
      {!isBackOffice && <Navigation />}
      <main className={`flex-1 ${isBackOffice ? '' : 'pt-24 sm:pt-28'}`}>{children}</main>
      {!isBackOffice && <WhatsAppButton />}
    </>
  );
}
