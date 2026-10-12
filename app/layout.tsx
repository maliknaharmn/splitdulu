import type { Metadata } from "next";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "./globals.css";

import { BillProvider } from "@/providers/bill-provider";

export const metadata: Metadata = {
  title: "SplitDulu — Split bill tanpa ribet",
  description: "Bagi bill bareng teman dengan cepat. Diskon, pajak, dan service langsung dihitung. Tanpa login.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <BillProvider>{children}</BillProvider>
      </body>
    </html>
  );
}
