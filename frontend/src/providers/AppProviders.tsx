"use client";

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/providers/AuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <MantineProvider forceColorScheme="dark" theme={{ primaryColor: "blue" }}>
      <ModalsProvider>
        <Notifications position="top-right" />
        <AuthProvider>{children}</AuthProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
