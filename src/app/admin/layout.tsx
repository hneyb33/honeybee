import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell/AdminShell";
import { AdminSessionProvider } from "@/lib/admin/session";

/**
 * Root of the admin surface. Wraps every /admin/* page in the session
 * provider (auth + role gate) and the TailAdmin-style shell (sidebar +
 * topbar). Child pages do not need to repeat the auth check.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  );
}

export const metadata = {
  title: "Honeybee Admin",
  robots: { index: false, follow: false },
};
