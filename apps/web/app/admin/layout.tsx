import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import '../styles/admin.css';
import '../styles/confirm-modal.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}
