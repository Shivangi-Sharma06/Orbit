"use client";

import { AppShell, Box, Button, Divider, Group, NavLink, Stack, Text } from "@mantine/core";
import { Gauge, LogOut, MapPinned, Plus, QrCode, Settings, Smartphone, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/devices", label: "My Devices", icon: Smartphone },
  { href: "/claim", label: "Claim Device", icon: QrCode }
];

const adminLinks = [
  { href: "/admin", label: "All Devices", icon: Settings },
  { href: "/admin/create", label: "Create Devices", icon: Plus },
  { href: "/admin/users", label: "Users", icon: Users }
];

export function AppShellFrame({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    if (adminOnly && user?.role !== "ADMIN") router.replace("/dashboard");
  }, [adminOnly, ready, router, user]);

  if (!ready || !user) return null;

  return (
    <AppShell navbar={{ width: 240, breakpoint: "sm" }} padding="lg">
      <AppShell.Navbar p="md">
        <Stack h="100%">
          <Group gap="sm">
            <MapPinned size={28} color="#3b82f6" />
            <Text fw={800} size="xl">Geonyx</Text>
          </Group>
          <Divider color="#252a32" />
          <Stack gap={4}>
            {userLinks.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.label}
                active={pathname === item.href}
                leftSection={<item.icon size={18} />}
              />
            ))}
          </Stack>
          {user.role === "ADMIN" && (
            <>
              <Divider color="#252a32" label="Admin" labelPosition="left" />
              <Stack gap={4}>
                {adminLinks.map((item) => (
                  <NavLink
                    key={item.href}
                    component={Link}
                    href={item.href}
                    label={item.label}
                    active={pathname === item.href}
                    leftSection={<item.icon size={18} />}
                  />
                ))}
              </Stack>
            </>
          )}
          <Box mt="auto">
            <Text size="sm" fw={700}>{user.name}</Text>
            <Text size="xs" c="#6b7685" mb="sm">{user.email}</Text>
            <Button fullWidth variant="subtle" color="red" leftSection={<LogOut size={16} />} onClick={logout}>
              Logout
            </Button>
          </Box>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main bg="#0d0f12">{children}</AppShell.Main>
    </AppShell>
  );
}
