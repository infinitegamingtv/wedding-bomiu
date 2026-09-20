import { Lora, Fleur_De_Leah } from "next/font/google";
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
  title: "Thiệp Cưới Quang Trưởng & Hồng Nhung",
  description: "Trân trọng kính mời tới dự lễ thành hôn của Quang Trưởng và Hồng Nhung",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${lora.variable} ${fleurDeLeah.variable}`}><ButtonSfx />{children}</body>
    </html>
  );
}
