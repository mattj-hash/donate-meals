import type { Metadata } from "next";
import SessionProvider from "./SessionProvider";

export const metadata: Metadata = {
  title: "Donate Meals | Rethink Food",
  description: "Help provide meals to those in need.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
