import { Figtree, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "PesaGrid | Automated Reconciliation & Payments for Kenya",
    template: "%s | PesaGrid",
  },
  description:
    "Automate your business reconciliation across M-PESA, banks, and more. Real-time oversight of collections, outstanding balances, and cash flow for modern Kenyan businesses.",
  keywords: [
    "reconciliation",
    "M-PESA automation",
    "business payments Kenya",
    "payment reconciliation",
    "financial automation",
    "PesaGrid",
    "Kenyan SaaS",
    "automated invoicing",
    "PesaGrid Team",
  ],
  authors: [{ name: "PesaGrid Team" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://pesagrid.com",
    title: "PesaGrid | Automated Reconciliation & Payments",
    description:
      "Stop chasing payments. Automate reconciliation across M-PESA, bank transfers, and more.",
    siteName: "PesaGrid",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PesaGrid Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PesaGrid | Automated Reconciliation & Payments",
    description:
      "Reconcile M-PESA and bank payments instantly. Built for modern Kenyan businesses.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-79CFCLSTJS"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-79CFCLSTJS');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
