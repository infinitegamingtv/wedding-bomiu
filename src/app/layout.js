import { Lora, Fleur_De_Leah } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ButtonSfx from "@/components/ButtonSfx";

const lora = Lora({
  subsets: ["vietnamese", "latin"],
  variable: "--font-lora",
  display: "swap",
});

const fleurDeLeah = Fleur_De_Leah({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fleur",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://damcuoibomiu.vercel.app"),
  title: "Thiệp Cưới Quang Trưởng & Hồng Nhung",
  description: "Trân trọng kính mời tới dự lễ thành hôn của Quang Trưởng và Hồng Nhung",
  openGraph: {
    title: "Thiệp Cưới Quang Trưởng & Hồng Nhung",
    description: "Trân trọng kính mời tới dự lễ thành hôn của Quang Trưởng và Hồng Nhung",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/optimized/uploads/TVBA9926-2.webp",
        width: 1200,
        height: 800,
        alt: "Thiệp Cưới Quang Trưởng & Hồng Nhung",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thiệp Cưới Quang Trưởng & Hồng Nhung",
    description: "Trân trọng kính mời tới dự lễ thành hôn của Quang Trưởng và Hồng Nhung",
    images: ["/optimized/uploads/TVBA9926-2.webp"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${lora.variable} ${fleurDeLeah.variable}`}><ButtonSfx />{children}<Analytics /></body>
    </html>
  );
}
