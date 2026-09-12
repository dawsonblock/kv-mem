import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'KV-Memory Platform & Explorer',
  description: 'Interactive research workbench, memory timeline simulator, and release qualification portal for KV-Memory (kvmem-qw3) tiered LLM agent memory architecture.',
  openGraph: {
    title: 'KV-Memory Platform & Explorer',
    description: 'Interactive research workbench, memory timeline simulator, and release qualification portal for KV-Memory (kvmem-qw3) tiered LLM agent memory architecture.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KV-Memory Platform & Explorer',
    description: 'Interactive research workbench, memory timeline simulator, and release qualification portal for KV-Memory (kvmem-qw3) tiered LLM agent memory architecture.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
