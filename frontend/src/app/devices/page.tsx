"use client";

import { ActionIcon, Button, Group, Paper, Stack, Table, Title, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { Eye, Unlink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShellFrame } from "@/components/AppShellFrame";
import { DataState } from "@/components/DataState";
import { StatusBadge } from "@/components/StatusBadge";
import { api, unwrap } from "@/lib/api";
import type { Device } from "@/lib/types";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setDevices(unwrap<Device[]>(await api.get("/api/devices/mine")));
    setLoading(false);
  }

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  function unbind(deviceId: string) {
    modals.openConfirmModal({
      title: "Unbind device",
      children: "This removes the device from your account.",
      labels: { confirm: "Unbind", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await api.post(`/api/devices/${deviceId}/unbind`);
        notifications.show({ color: "green", message: "Device unbound" });
        await load();
      }
    });
  }

  return (
    <AppShellFrame>
      <Stack>
        <Title order={1}>My Devices</Title>
        <DataState loading={loading}>
          <Paper bg="#161a1f" withBorder radius={8}>
            <Table.ScrollContainer minWidth={760}>
              <Table>
                <Table.Thead><Table.Tr><Table.Th>Device ID</Table.Th><Table.Th>Status</Table.Th><Table.Th>Claimed at</Table.Th><Table.Th>Last seen</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {devices.map((device) => (
                    <Table.Tr key={device.id}>
                      <Table.Td>{device.deviceId}</Table.Td>
                      <Table.Td><StatusBadge status={device.status} /></Table.Td>
                      <Table.Td>{device.claimedAt ? dayjs(device.claimedAt).format("DD MMM YYYY HH:mm") : "-"}</Table.Td>
                      <Table.Td>{device.lastSeen ? dayjs(device.lastSeen).format("DD MMM YYYY HH:mm") : "Never"}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="View"><ActionIcon component={Link} href={`/devices/${device.deviceId}`}><Eye size={16} /></ActionIcon></Tooltip>
                          <Tooltip label="Unbind"><ActionIcon color="red" onClick={() => unbind(device.deviceId)}><Unlink size={16} /></ActionIcon></Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
          <Button component={Link} href="/claim" w="fit-content">Claim Device</Button>
        </DataState>
      </Stack>
    </AppShellFrame>
  );
}
