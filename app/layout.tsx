import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Bitgo Whitelabel',
  description: 'Wallet cripto con estética de app bancaria, sobre BitGo testnet.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
