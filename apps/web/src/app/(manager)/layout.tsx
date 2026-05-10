import { RequireAuth } from "@/lib/auth/RequireAuth";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["cleaning_manager", "super_manager"]}>{children}</RequireAuth>
  );
}
