import type { Metadata } from "next";
import { Inter, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins'
});
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto'
});

export const metadata: Metadata = {
  title: "Instructor Lounge - Invoice Management",
  description: "Professional invoice management system for instructors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} ${roboto.variable}`}>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster position="top-right" richColors />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
