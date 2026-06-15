import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nulim.vercel.app'),
  title: "نُلِم | مستشار القبول الجامعي",
  description:
    "مستشار قبول جامعي ذكي يساعد الطلاب والطالبات في السعودية على تحليل النسب الموزونة والمكافئة واختيار أنسب الجامعات والتخصصات من بين 21 جامعة وأكثر من 1000 برنامج.",
  applicationName: "نُلِم",
  keywords: [
    "مستشار قبول",
    "جامعات السعودية",
    "نسبة موزونة",
    "قبول جامعي",
    "نُلِم",
    "NULIM",
    "تخصصات جامعية",
    "قدرات",
    "تحصيلي",
  ],
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-192.png",
    shortcut: "/favicon-32.png",
  },
  openGraph: {
    title: "نُلِم | مستشار القبول الجامعي",
    description:
      "حلل نسبتك واسأل عن أفضل فرص القبول في الجامعات السعودية.",
    locale: "ar_SA",
    type: "website",
    siteName: "نُلِم - NULIM",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "شعار نُلِم",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nulimaia",
    creator: "@nulimaia",
    title: "نُلِم | مستشار القبول الجامعي",
    description:
      "مستشار قبول ذكي يحلل نسبتك ويوصي بأنسب الجامعات السعودية.",
    images: ["/logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "نُلِم - مستشار القبول الجامعي",
  alternateName: "NULIM",
  description:
    "مستشار قبول جامعي ذكي يساعد الطلاب في السعودية على تحليل النسب واختيار الجامعات.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "SAR",
  },
  inLanguage: "ar",
  countryOfOrigin: {
    "@type": "Country",
    name: "SA",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
