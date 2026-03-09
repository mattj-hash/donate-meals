import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
