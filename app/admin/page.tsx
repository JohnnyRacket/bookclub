import { requireAdmin, listMembers } from '@/lib/actions/admin';
import { getSubmittedBooks } from '@/lib/actions/admin-books';
import { AdminPanel } from '@/components/auth/AdminPanel';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function AdminPage() {
  await requireAdmin();
  const [members, submittedBooks] = await Promise.all([
    listMembers(),
    getSubmittedBooks(),
  ]);

  return (
    <AuthShell>
      <AdminPanel members={members} submittedBooks={submittedBooks} />
    </AuthShell>
  );
}
