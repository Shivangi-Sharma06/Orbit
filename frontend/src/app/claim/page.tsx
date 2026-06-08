"use client";

import { Button, Group, Paper, Stack, Tabs, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Html5QrcodeScanner } from "html5-qrcode";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShellFrame } from "@/components/AppShellFrame";
import { StatusBadge } from "@/components/StatusBadge";
import { api, unwrap } from "@/lib/api";
import type { Device } from "@/lib/types";

function codeFromToken(token: string) {
  const normalized = token.replaceAll("-", "+").replaceAll("_", "/");
  const parsed = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
  if (!parsed || typeof parsed.activationCode !== "string") throw new Error("Invalid claim QR");
  return parsed.activationCode;
}

function tokenFromScan(text: string) {
  try {
    return new URL(text).searchParams.get("token");
  } catch {
    return text.includes("token=") ? new URL(`http://localhost/?${text.split("?").at(-1)}`).searchParams.get("token") : text;
  }
}

function notifyClaimError(error: unknown) {
  notifications.show({ color: "red", message: error instanceof Error ? error.message : "Claim failed" });
}

function ClaimContent() {
  const search = useSearchParams();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [code, setCode] = useState("");
  const [claimed, setClaimed] = useState<Device | null>(null);
  const [loading, setLoading] = useState(false);

  async function claim(value = code) {
    const activationCode = value.trim().toUpperCase();
    if (!activationCode) {
      notifications.show({ color: "red", message: "Enter an activation code" });
      return;
    }
    setLoading(true);
    try {
      const device = unwrap<Device>(await api.post("/api/devices/claim", { activationCode }));
      setClaimed(device);
      notifications.show({ color: "green", message: "Device claimed" });
    } catch (error) {
      notifyClaimError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = search.get("token");
    if (token) {
      try {
        const decoded = codeFromToken(token);
        setCode(decoded);
        claim(decoded);
      } catch (error) {
        notifyClaimError(error);
      }
    }
  }, []);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 8, qrbox: { width: 250, height: 250 } }, false);
    scannerRef.current.render((text) => {
      try {
        const token = tokenFromScan(text);
        claim(token ? codeFromToken(token) : text);
      } catch (error) {
        notifyClaimError(error);
      }
    }, () => undefined);
    return () => { scannerRef.current?.clear().catch(() => undefined); };
  }, []);

  return (
    <AppShellFrame>
      <Stack>
        <Title order={1}>Claim Device</Title>
        <Paper bg="#161a1f" withBorder radius={8} p="lg">
          <Tabs defaultValue="scan">
            <Tabs.List>
              <Tabs.Tab value="scan">Scan QR</Tabs.Tab>
              <Tabs.Tab value="code">Enter Code</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="scan" pt="lg"><div id="qr-reader" /></Tabs.Panel>
            <Tabs.Panel value="code" pt="lg">
              <Group align="end">
                <TextInput label="Activation code" value={code} onChange={(e) => setCode(e.currentTarget.value)} maw={360} />
                <Button onClick={() => claim()} loading={loading}>Claim</Button>
              </Group>
            </Tabs.Panel>
          </Tabs>
        </Paper>
        {claimed && (
          <Paper bg="#161a1f" withBorder radius={8} p="lg">
            <Group justify="space-between">
              <Stack gap={4}>
                <Text fw={800}>{claimed.deviceId}</Text>
                <StatusBadge status={claimed.status} />
              </Stack>
              <Button component={Link} href={`/devices/${claimed.deviceId}`}>View Device</Button>
            </Group>
          </Paper>
        )}
      </Stack>
    </AppShellFrame>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimContent />
    </Suspense>
  );
}
