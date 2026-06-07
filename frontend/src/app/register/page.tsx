"use client";

import { Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (values.password !== values.confirm) {
      notifications.show({ color: "red", message: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      await register({ name: values.name, email: values.email, password: values.password });
      router.push("/dashboard");
    } catch (error) {
      notifications.show({ color: "red", message: error instanceof Error ? error.message : "Registration failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack align="center" justify="center" mih="100vh" bg="#0d0f12">
      <Paper w="min(460px, calc(100vw - 32px))" p="xl" radius={8} bg="#161a1f" withBorder>
        <Stack>
          <Title order={1}>Create Account</Title>
          <TextInput label="Name" value={values.name} onChange={(e) => setValues({ ...values, name: e.currentTarget.value })} />
          <TextInput label="Email" value={values.email} onChange={(e) => setValues({ ...values, email: e.currentTarget.value })} />
          <PasswordInput label="Password" value={values.password} onChange={(e) => setValues({ ...values, password: e.currentTarget.value })} />
          <PasswordInput label="Confirm password" value={values.confirm} onChange={(e) => setValues({ ...values, confirm: e.currentTarget.value })} />
          <Button onClick={submit} loading={loading}>Register</Button>
          <Text size="sm" c="#6b7685">Already have an account? <Link href="/login">Sign in</Link></Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
