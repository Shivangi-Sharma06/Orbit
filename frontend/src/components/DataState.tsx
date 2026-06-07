"use client";

import { Alert, Loader, Stack } from "@mantine/core";

export function DataState({ loading, error, children }: { loading: boolean; error?: string | null; children: React.ReactNode }) {
  if (loading) return <Stack align="center" py="xl"><Loader /></Stack>;
  if (error) return <Alert color="red" variant="light">{error}</Alert>;
  return <>{children}</>;
}
