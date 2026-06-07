"use client";

import { ActionIcon, Button, Group, NumberInput, Paper, Stack, Table, Title, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Copy, Download } from "lucide-react";
import { useState } from "react";
import { AppShellFrame } from "@/components/AppShellFrame";
import { api, unwrap } from "@/lib/api";
import type { Device } from "@/lib/types";

function claimUrl(device: Device) {
  const token = btoa(JSON.stringify({ deviceId: device.deviceId, activationCode: device.activationCode })).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return `${window.location.origin}/claim?token=${token}`;
}

export default function CreateDevicesPage() {
  const [count, setCount] = useState<number | string>(5);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const created = unwrap<Device[]>(await api.post("/api/admin/devices/create-bulk", { count: Number(count) }));
      setDevices(created);
      notifications.show({ color: "green", message: `${created.length} devices created` });
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    const rows = [["Device ID", "Activation Code", "QR Claim URL"], ...devices.map((d) => [d.deviceId, d.activationCode, claimUrl(d)])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "geonyx-devices.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShellFrame adminOnly>
      <Stack>
        <Title order={1}>Create Devices</Title>
        <Paper bg="#161a1f" withBorder radius={8} p="lg">
          <Group align="end">
            <NumberInput label="Count" min={1} max={100} value={count} onChange={setCount} w={160} />
            <Button onClick={generate} loading={loading}>Generate</Button>
            <Button variant="light" leftSection={<Download size={16} />} disabled={!devices.length} onClick={downloadCsv}>Download CSV</Button>
          </Group>
        </Paper>
        {devices.length > 0 && (
          <Paper bg="#161a1f" withBorder radius={8}>
            <Table.ScrollContainer minWidth={760}>
              <Table>
                <Table.Thead><Table.Tr><Table.Th>Device ID</Table.Th><Table.Th>Activation Code</Table.Th><Table.Th>Copy</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {devices.map((device) => (
                    <Table.Tr key={device.id}>
                      <Table.Td>{device.deviceId}</Table.Td>
                      <Table.Td>{device.activationCode}</Table.Td>
                      <Table.Td>
                        <Tooltip label="Copy code">
                          <ActionIcon onClick={() => navigator.clipboard.writeText(device.activationCode)}>
                            <Copy size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>
    </AppShellFrame>
  );
}
