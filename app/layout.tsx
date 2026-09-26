import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QuantumElement 3D | عنصر كوانتوم',
  description:
    'Multi-scale 3D interactive physics universe exploring all 118 periodic table elements across 5 powers of ten—from macroscopic periodic table down to vibrating Planck strings.',
  keywords: [
    'Periodic Table 3D',
    'Quantum Physics',
    'Subatomic Particles',
    'Quarks',
    'String Theory',
    'Calabi-Yau',
    'WebGL',
    'Three.js',
    'عنصر كوانتوم',
    'الجدول الدوري ثلاثي الأبعاد',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${cairo.variable}`}>
      <body className="font-sans bg-[#030712] text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
