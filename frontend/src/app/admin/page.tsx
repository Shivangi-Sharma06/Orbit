"use client";

import { ActionIcon, Button, Group, Image, Modal, Pagination, Paper, Select, Stack, Table, TextInput, Title, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { Eye, QrCode, Trash2, Unlink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShellFrame } from "@/components/AppShellFrame";
import { DataState } from "@/components/DataState";
import { StatusBadge } from "@/components/StatusBadge";
import { api, unwrap } from "@/lib/api";
import type { Device, DeviceStatus } from "@/lib/types";

type DevicePage = { items: Device[]; total: number; page: number; pageSize: number };

export default function AdminDevicesPage() {
  const [data, setData] = useState<DevicePage>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    setData(unwrap<DevicePage>(await api.get(`/api/admin/devices?${params}`)));
    setLoading(false);
  }

  useEffect(() => { load().catch(() => setLoading(false)); }, [page, status]);

  async function showQr(deviceId: string) {
    const data = unwrap<{ qrCodeBase64: string }>(await api.get(`/api/admin/devices/${deviceId}/qr`));
    setQr(data.qrCodeBase64);
  }

  function forceUnbind(deviceId: string) {
    modals.openConfirmModal({
      title: "Force unbind",
      children: "This removes ownership regardless of current user.",
      labels: { confirm: "Force unbind", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await api.post(`/api/admin/devices/${deviceId}/force-unbind`);
        notifications.show({ color: "green", message: "Device unbound" });
        await load();
      }
    });
  }

  function remove(deviceId: string) {
    modals.openConfirmModal({
      title: "Delete device",
      children: "Only unclaimed devices can be deleted.",
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await api.delete(`/api/admin/devices/${deviceId}`);
        notifications.show({ color: "green", message: "Device deleted" });
        await load();
      }
    });
  }

  return (
    <AppShellFrame adminOnly>
      <Stack>
        <Title order={1}>All Devices</Title>
        <Group>
          <Select placeholder="Status" clearable data={["UNCLAIMED", "CLAIMED", "ACTIVE", "UNBOUND", "INACTIVE"]} value={status} onChange={setStatus} />
          <TextInput placeholder="Search device or owner" value={search} onChange={(e) => setSearch(e.currentTarget.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <Button onClick={load}>Search</Button>
          <Button variant="light" onClick={async () => { await Promise.all(data.items.map((d) => api.post(`/api/admin/devices/${d.deviceId}/force-unbind`))); await load(); }}>
            Bulk Force Unbind
          </Button>
        </Group>
        <DataState loading={loading}>
          <Paper bg="#161a1f" withBorder radius={8}>
            <Table.ScrollContainer minWidth={980}>
              <Table>
                <Table.Thead><Table.Tr><Table.Th>Device ID</Table.Th><Table.Th>Activation Code</Table.Th><Table.Th>Status</Table.Th><Table.Th>Owner</Table.Th><Table.Th>Claimed At</Table.Th><Table.Th>Last Seen</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {data.items.map((device) => (
                    <Table.Tr key={device.id}>
                      <Table.Td>{device.deviceId}</Table.Td>
                      <Table.Td onClick={() => setRevealed({ ...revealed, [device.id]: !revealed[device.id] })} style={{ cursor: "pointer" }}>{revealed[device.id] ? device.activationCode : "****************"}</Table.Td>
                      <Table.Td><StatusBadge status={device.status as DeviceStatus} /></Table.Td>
                      <Table.Td>{device.owner?.email ?? "-"}</Table.Td>
                      <Table.Td>{device.claimedAt ? dayjs(device.claimedAt).format("DD MMM YYYY HH:mm") : "-"}</Table.Td>
                      <Table.Td>{device.lastSeen ? dayjs(device.lastSeen).format("DD MMM YYYY HH:mm") : "Never"}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="View QR"><ActionIcon onClick={() => showQr(device.deviceId)}><QrCode size={16} /></ActionIcon></Tooltip>
                          <Tooltip label="Open"><ActionIcon component={Link} href={`/devices/${device.deviceId}`}><Eye size={16} /></ActionIcon></Tooltip>
                          <Tooltip label="Force unbind"><ActionIcon color="orange" onClick={() => forceUnbind(device.deviceId)}><Unlink size={16} /></ActionIcon></Tooltip>
                          {device.status === "UNCLAIMED" && <Tooltip label="Delete"><ActionIcon color="red" onClick={() => remove(device.deviceId)}><Trash2 size={16} /></ActionIcon></Tooltip>}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
          <Pagination total={Math.max(1, Math.ceil(data.total / data.pageSize))} value={page} onChange={setPage} />
        </DataState>
        <Modal opened={Boolean(qr)} onClose={() => setQr(null)} title="Claim QR">
          {qr && (
            <Stack>
              <Image src={qr} alt="Device claim QR" />
              <Button component="a" href={qr} download="geonyx-claim-qr.png">Download</Button>
            </Stack>
          )}
        </Modal>
      </Stack>
    </AppShellFrame>
  );
}
