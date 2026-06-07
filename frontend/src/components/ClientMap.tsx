"use client";

import dynamic from "next/dynamic";
import type { Location } from "@/lib/types";

const DynamicMap = dynamic(() => import("@/components/LocationMap").then((mod) => mod.LocationMap), {
  ssr: false
});

export function ClientMap({ locations }: { locations: Location[] }) {
  return <DynamicMap locations={locations} />;
}
