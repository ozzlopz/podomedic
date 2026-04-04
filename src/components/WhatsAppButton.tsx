'use client';

import { buildWhatsAppUrl } from '@/lib/contact';

const whatsappUrl = buildWhatsAppUrl('Hola, me gustaría recibir información sobre una consulta en PodoMedic.');

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enviar mensaje por WhatsApp a PodoMedic"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-[0_18px_40px_rgba(37,211,102,0.38)] transition-all duration-300 hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
    >
      <span className="text-base font-bold tracking-[0.01em] text-white sm:text-lg">
        Contáctanos
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="h-11 w-11 sm:h-12 sm:w-12"
      >
        <path
          fill="white"
          d="M20.04 7.5C13.1 7.5 7.46 13.05 7.46 19.91c0 2.4.69 4.7 2 6.7L8.16 32l6.21-1.62a12.67 12.67 0 0 0 5.68 1.37h.01c6.93 0 12.57-5.55 12.57-12.41 0-3.32-1.29-6.43-3.64-8.77A12.48 12.48 0 0 0 20.04 7.5Zm0 22.74h-.01a10.43 10.43 0 0 1-5.33-1.45l-.37-.22-3.69.96.99-3.57-.23-.37a10.23 10.23 0 0 1-1.62-5.49c0-5.75 4.72-10.43 10.51-10.43 2.8 0 5.42 1.09 7.4 3.05a10.31 10.31 0 0 1 3.07 7.38c0 5.75-4.72 10.43-10.5 10.43Z"
        />
        <path
          fill="white"
          d="M26.3 22.86c-.34-.17-2.01-.99-2.32-1.1-.3-.11-.53-.17-.75.17-.22.34-.87 1.1-1.07 1.33-.19.23-.39.25-.73.08-.34-.17-1.42-.53-2.72-1.68-1.01-.9-1.69-2-1.89-2.35-.19-.34-.02-.52.15-.69.15-.15.34-.4.51-.59.17-.19.23-.34.34-.57.11-.23.06-.42-.03-.59-.08-.17-.75-1.83-1.03-2.5-.27-.66-.56-.57-.75-.58h-.65c-.23 0-.58.08-.9.42-.31.34-1.18 1.16-1.18 2.82 0 1.67 1.21 3.27 1.39 3.5.17.23 2.4 3.81 5.91 5.19.84.34 1.49.54 2 .69.84.27 1.61.23 2.21.13.68-.1 2.01-.82 2.3-1.63.28-.81.28-1.5.19-1.66-.08-.14-.3-.22-.64-.39Z"
        />
      </svg>
    </a>
  );
}
