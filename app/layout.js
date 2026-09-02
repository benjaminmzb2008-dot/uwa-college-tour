import "./globals.css";
import { Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata = {
  title: "Campus Tour Challenge",
  description: "Amazing Race badge collection for competing teams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
