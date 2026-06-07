import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "نُلِم | مستشار القبول الجامعي",
  description:
    "مستشار قبول جامعي ذكي يساعد الطلاب والطالبات في السعودية على تحليل النسب واختيار أنسب الجامعات والتخصصات.",
  applicationName: "نُلِم",
  openGraph: {
    title: "نُلِم | مستشار القبول الجامعي",
    description:
      "حلل نسبتك واسأل عن أفضل فرص القبول في الجامعات السعودية.",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
