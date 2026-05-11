import { RequireAuth } from "@/lib/auth/RequireAuth";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={["building_owner"]}>{children}</RequireAuth>;
}
