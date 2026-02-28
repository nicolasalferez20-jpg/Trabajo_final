import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COLSOF - Sistema de gestión CSU",
  description: "Sistema de gestión CSU - COLSOF S.A.S",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
