import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "leaflet/dist/leaflet.css";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "Geonyx",
  description: "GPS device management platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
