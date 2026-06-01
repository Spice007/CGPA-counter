import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CGPA Counter | Admin Dashboard",
  description: "Modern Result Management System - CGPA Spreadsheet & Analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0B0F19] text-slate-200 antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 ml-56 flex flex-col relative overflow-hidden">
            <TopNavbar />
            <main className="flex-1 overflow-auto p-5 relative z-10">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
