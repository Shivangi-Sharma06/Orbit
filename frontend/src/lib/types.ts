export type Role = "ADMIN" | "USER";
export type DeviceStatus = "UNCLAIMED" | "CLAIMED" | "ACTIVE" | "UNBOUND" | "INACTIVE";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
  _count?: { devices: number };
};

export type Location = {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null;
  battery?: number | null;
  timestamp: string;
};

export type Device = {
  id: string;
  deviceId: string;
  activationCode: string;
  qrCodeBase64: string;
  status: DeviceStatus;
  ownerId?: string | null;
  owner?: Pick<User, "name" | "email"> | null;
  claimedAt?: string | null;
  lastSeen?: string | null;
  createdAt: string;
  locations?: Location[];
  latestLocation?: Location | null;
};

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
