import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'المستشار الذكي بالذكاء الاصطناعي',
  description: 'ابدأ المحادثة الآن مع مستشار القبول الجامعي الذكي نُلِم (Nulim). اكتب درجاتك ورغباتك واحصل على تقرير توصيات فوري لأفضل خيارات القبول بالجامعات السعودية والكليات العسكرية.',
  keywords: [
    "مستشار نلم الذكي",
    "نلم للقبول",
    "حساب النسبة الموزونة نلم",
    "توصيات القبول الجامعي",
    "اسأل مستشار القبول",
  ],
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
