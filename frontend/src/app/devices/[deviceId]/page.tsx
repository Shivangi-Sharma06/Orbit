"use client";

import { Button, Grid, Group, Paper, SegmentedControl, Stack, Table, Text, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AppShellFrame } from "@/components/AppShellFrame";
import { ClientMap } from "@/components/ClientMap";
import { DataState } from "@/components/DataState";
import { StatusBadge } from "@/components/StatusBadge";
import { api, unwrap } from "@/lib/api";
import type { Device, Location } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

export default function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { accessToken } = useAuth();
  const [device, setDevice] = useState<Device | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [mode, setMode] = useState<"live" | "history">("live");
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = unwrap<Device>(await api.get(`/api/devices/${deviceId}`));
    setDevice(data);
    setLocations(data.locations ?? []);
  }

  async function loadHistory() {
    const params = new URLSearchParams({ limit: "300" });
    if (range[0]) params.set("from", range[0].toISOString());
    if (range[1]) params.set("to", range[1].toISOString());
    setLocations(unwrap<Location[]>(await api.get(`/api/devices/${deviceId}/locations?${params}`)));
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [deviceId]);

  useEffect(() => {
    if (mode !== "live" || !accessToken) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000");
    socket.emit("join:device", { deviceId, token: accessToken });
    socket.on("location:update", (location: Location) => {
      setLocations((current) => [location, ...current].slice(0, 100));
      setDevice((current) => current ? { ...current, status: "ACTIVE", lastSeen: location.timestamp } : current);
    });
    return () => {
      socket.emit("leave:device", { deviceId });
      socket.disconnect();
    };
  }, [accessToken, deviceId, mode]);

  return (
    <AppShellFrame>
      <DataState loading={loading}>
        {device && (
          <Stack>
            <Group justify="space-between" align="center">
              <Title order={1}>{device.deviceId}</Title>
              <SegmentedControl value={mode} onChange={(v) => setMode(v as "live" | "history")} data={["live", "history"]} />
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Paper bg="#161a1f" withBorder radius={8} p="lg">
                  <Stack>
                    <StatusBadge status={device.status} />
                    <Text c="#6b7685">Claimed at</Text>
                    <Text>{device.claimedAt ? dayjs(device.claimedAt).format("DD MMM YYYY HH:mm") : "-"}</Text>
                    <Text c="#6b7685">Battery</Text>
                    <Text>{locations[0]?.battery ?? "-"}%</Text>
                    <Text c="#6b7685">Last seen</Text>
                    <Text>{device.lastSeen ? dayjs(device.lastSeen).format("DD MMM YYYY HH:mm") : "Never"}</Text>
                    {mode === "history" && (
                      <>
                        <DatePickerInput type="range" label="Date range" value={range} onChange={setRange} />
                        <Button onClick={loadHistory}>Load History</Button>
                      </>
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 9 }}>
                <Paper bg="#161a1f" withBorder radius={8} p={0} style={{ overflow: "hidden" }}>
                  <ClientMap locations={locations} />
                </Paper>
              </Grid.Col>
            </Grid>
            <Paper bg="#161a1f" withBorder radius={8}>
              <Table.ScrollContainer minWidth={760}>
                <Table>
                  <Table.Thead><Table.Tr><Table.Th>Timestamp</Table.Th><Table.Th>Latitude</Table.Th><Table.Th>Longitude</Table.Th><Table.Th>Speed</Table.Th><Table.Th>Battery</Table.Th></Table.Tr></Table.Thead>
                  <Table.Tbody>
                    {locations.map((loc) => (
                      <Table.Tr key={loc.id}>
                        <Table.Td>{dayjs(loc.timestamp).format("DD MMM YYYY HH:mm:ss")}</Table.Td>
                        <Table.Td>{loc.latitude.toFixed(6)}</Table.Td>
                        <Table.Td>{loc.longitude.toFixed(6)}</Table.Td>
                        <Table.Td>{loc.speed ?? "-"}</Table.Td>
                        <Table.Td>{loc.battery ?? "-"}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Stack>
        )}
      </DataState>
    </AppShellFrame>
  );
}
