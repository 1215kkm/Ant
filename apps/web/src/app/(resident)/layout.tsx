import { RequireAuth } from "@/lib/auth/RequireAuth";

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={["resident"]}>{children}</RequireAuth>;
}
