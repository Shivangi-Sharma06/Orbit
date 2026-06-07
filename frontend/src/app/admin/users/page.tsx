"use client";

import { Badge, Button, Paper, Stack, Table, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { AppShellFrame } from "@/components/AppShellFrame";
import { DataState } from "@/components/DataState";
import { api, unwrap } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setUsers(unwrap<User[]>(await api.get("/api/admin/users")));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(user: User) {
    const role = user.role === "ADMIN" ? "USER" : "ADMIN";
    await api.patch(`/api/admin/users/${user.id}/role`, { role });
    notifications.show({ color: "green", message: "Role updated" });
    await load();
  }

  return (
    <AppShellFrame adminOnly>
      <Stack>
        <Title order={1}>Users</Title>
        <DataState loading={loading}>
          <Paper bg="#161a1f" withBorder radius={8}>
            <Table.ScrollContainer minWidth={760}>
              <Table>
                <Table.Thead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Email</Table.Th><Table.Th>Role</Table.Th><Table.Th>Device Count</Table.Th><Table.Th>Joined At</Table.Th><Table.Th>Action</Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>
                  {users.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>{user.name}</Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td><Badge color={user.role === "ADMIN" ? "blue" : "gray"}>{user.role}</Badge></Table.Td>
                      <Table.Td>{user._count?.devices ?? 0}</Table.Td>
                      <Table.Td>{user.createdAt ? dayjs(user.createdAt).format("DD MMM YYYY") : "-"}</Table.Td>
                      <Table.Td><Button size="xs" variant="light" onClick={() => toggle(user)}>Make {user.role === "ADMIN" ? "User" : "Admin"}</Button></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        </DataState>
      </Stack>
    </AppShellFrame>
  );
}
