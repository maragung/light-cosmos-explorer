import './globals.css'; // Pastikan Anda memiliki file css global atau hapus baris ini jika menggunakan Tailwind via CDN/config lain
import { RpcProvider } from '@/context/RpcContext';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'Warden Protocol Explorer',
  description: 'Blockchain explorer for Warden Protocol',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-900 text-white min-h-screen">
        <RpcProvider>
          <AppShell>
            {children}
          </AppShell>
        </RpcProvider>
      </body>
    </html>
  );
}