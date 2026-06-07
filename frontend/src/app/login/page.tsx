"use client";

import { Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error) {
      notifications.show({ color: "red", message: error instanceof Error ? error.message : "Login failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack align="center" justify="center" mih="100vh" bg="#0d0f12">
      <Paper w="min(420px, calc(100vw - 32px))" p="xl" radius={8} bg="#161a1f" withBorder>
        <Stack>
          <Title order={1}>Geonyx</Title>
          <Text c="#6b7685">Sign in to manage GPS devices.</Text>
          <TextInput label="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput label="Password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
          <Button onClick={submit} loading={loading}>Login</Button>
          <Text size="sm" c="#6b7685">New here? <Link href="/register">Create an account</Link></Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
