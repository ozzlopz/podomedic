'use client';

import type { CartItem } from '@/types/store';

export const PODOMEDIC_WHATSAPP_NUMBER = '527719625242';

type CartInquiryOptions = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  reference?: string;
};

export function buildCartInquiryMessage(items: CartItem[], subtotal: number, options?: CartInquiryOptions) {
  const lines = [
    'Hola, me interesa este pedido de productos de PodoMedic:',
    '',
    ...(options?.reference ? [`Folio de solicitud: ${options.reference}`, ''] : []),
    ...(options?.customerName ? [`Nombre: ${options.customerName}`] : []),
    ...(options?.customerEmail ? [`Correo: ${options.customerEmail}`] : []),
    ...(options?.customerPhone ? [`Teléfono: ${options.customerPhone}`] : []),
    ...(options?.customerName || options?.customerEmail || options?.customerPhone ? [''] : []),
    ...items.map(
      (item, index) =>
        `${index + 1}. ${item.name} x${item.quantity} - ${new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          maximumFractionDigits: 0,
        }).format(item.price * item.quantity)}`,
    ),
    '',
    `Subtotal estimado: ${new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(subtotal)}`,
    '',
    ...(options?.notes ? [`Notas: ${options.notes}`, ''] : []),
    'Quisiera confirmar disponibilidad y el proceso de compra.',
  ];

  return lines.join('\n');
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${PODOMEDIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
