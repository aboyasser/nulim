import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nulim.vercel.app'),
  title: {
    default: "نلم | مستشار القبول الجامعي الذكي للجامعات السعودية - Nulim",
    template: "%s | نلم - مستشار القبول الجامعي"
  },
  description:
    "منصة نلم (Nulim) هي مستشار القبول الجامعي الذكي بالذكاء الاصطناعي في السعودية. تساعد الطلاب والطالبات على حساب النسبة الموزونة والمكافئة واكتشاف التخصصات المتاحة في 21 جامعة وكلية عسكرية.",
  applicationName: "نلم - Nulim",
  keywords: [
    "نلم",
    "نُلِم",
    "نليم",
    "NULIM",
    "Nulim",
    "مستشار القبول",
    "مستشار القبول الجامعي",
    "مستشار القبول نلم",
    "منصة نلم",
    "موقع نلم",
    "جامعات السعودية",
    "نسبة موزونة",
    "قبول جامعي",
    "المنصة الوطنية للقبول الموحد",
    "uap.sa",
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
    title: "نلم | مستشار القبول الجامعي الذكي للجامعات السعودية - Nulim",
    description:
      "منصة نلم (Nulim) تساعد طلاب وطالبات السعودية على حساب النسبة الموزونة والمكافئة واكتشاف أفضل فرص وتخصصات القبول.",
    locale: "ar_SA",
    type: "website",
    siteName: "منصة نلم - NULIM",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "شعار منصة نلم - Nulim",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nulimaia",
    creator: "@nulimaia",
    title: "نلم | مستشار القبول الجامعي الذكي - Nulim",
    description:
      "منصة نلم (Nulim) هي مستشار قبول ذكي يحلل نسبتك ويوصي بأنسب الجامعات السعودية.",
    images: ["/logo.png"],
  },
  verification: {
    google: "AHZRclUip4_qoZoNoIQyoEUnUbdGiSJxaS_b2gW-z28",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "نلم - مستشار القبول الجامعي",
  alternateName: ["NULIM", "Nulim", "نُلِم", "نلم", "نليم"],
  description:
    "مستشار قبول جامعي ذكي يساعد الطلاب في السعودية على حساب النسب واختيار التخصصات.",
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FFBGXGWQ64"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FFBGXGWQ64');
          `}
        </Script>
      </body>
    </html>
  );
}
