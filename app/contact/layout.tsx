import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'اتصل بنا | نُلِم',
  description: 'أرسل اقتراحاتك وملاحظاتك لفريق نُلِم عبر نموذج التواصل أو منصة إكس والبريد الإلكتروني.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
