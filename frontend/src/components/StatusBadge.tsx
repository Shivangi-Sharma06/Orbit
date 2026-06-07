"use client";

import { Badge } from "@mantine/core";
import type { DeviceStatus } from "@/lib/types";

const colors: Record<DeviceStatus, string> = {
  UNCLAIMED: "gray",
  CLAIMED: "yellow",
  ACTIVE: "green",
  UNBOUND: "orange",
  INACTIVE: "red"
};

export function StatusBadge({ status }: { status: DeviceStatus }) {
  return <Badge color={colors[status]} variant="light">{status}</Badge>;
}
