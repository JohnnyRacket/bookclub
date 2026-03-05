import { requireAdmin, listMembers } from '@/lib/actions/admin';
import { AdminPanel } from '@/components/auth/AdminPanel';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function AdminPage() {
  await requireAdmin();
  const members = await listMembers();

  return (
    <AuthShell>
      <AdminPanel members={members} />
    </AuthShell>
  );
}
