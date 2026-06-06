import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CGPA Counter | Admin Dashboard",
  description: "Modern Result Management System - CGPA Spreadsheet & Analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0B0F19] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}
