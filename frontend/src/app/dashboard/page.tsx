"use client";

import { Grid, Group, Paper, Stack, Table, Text, Title } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { AppShellFrame } from "@/components/AppShellFrame";
import { DataState } from "@/components/DataState";
import { StatusBadge } from "@/components/StatusBadge";
import { api, unwrap } from "@/lib/api";
import type { Device } from "@/lib/types";

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/devices/mine").then((r) => setDevices(unwrap<Device[]>(r))).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const active = devices.filter((d) => d.status === "ACTIVE").length;
  const offline = devices.length - active;

  return (
    <AppShellFrame>
      <Stack>
        <Title order={1}>Dashboard</Title>
        <DataState loading={loading} error={error}>
          <Grid>
            {[["Total devices", devices.length], ["Active", active], ["Offline", offline]].map(([label, value]) => (
              <Grid.Col key={label} span={{ base: 12, sm: 4 }}>
                <Paper p="lg" radius={8} bg="#161a1f" withBorder>
                  <Text c="#6b7685" size="sm">{label}</Text>
                  <Text fw={800} size="34px">{value}</Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
          <Paper bg="#161a1f" withBorder radius={8}>
            <Table.ScrollContainer minWidth={760}>
              <Table>
                <Table.Thead><Table.Tr><Table.Th>Device ID</Table.Th><Table.Th>Last lat/lng</Table.Th><Table.Th>Last seen</Table.Th><Table.Th>Status</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {devices.map((device) => (
                    <Table.Tr key={device.id}>
                      <Table.Td>{device.deviceId}</Table.Td>
                      <Table.Td>{device.latestLocation ? `${device.latestLocation.latitude.toFixed(5)}, ${device.latestLocation.longitude.toFixed(5)}` : "No data"}</Table.Td>
                      <Table.Td>{device.lastSeen ? dayjs(device.lastSeen).format("DD MMM YYYY HH:mm") : "Never"}</Table.Td>
                      <Table.Td><StatusBadge status={device.status} /></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
          {!devices.length && <Group justify="center"><Text c="#6b7685">No devices claimed yet.</Text></Group>}
        </DataState>
      </Stack>
    </AppShellFrame>
  );
}
