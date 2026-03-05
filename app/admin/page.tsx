import { requireAdmin, listMembers } from '@/lib/actions/admin';
import { getSubmittedBooks, getCurrentBookAdmin } from '@/lib/actions/admin-books';
import { getClubConfig } from '@/lib/actions/settings';
import { AdminPanel } from '@/components/auth/AdminPanel';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function AdminPage() {
  await requireAdmin();
  const [members, submittedBooks, currentBook, clubSettings] = await Promise.all([
    listMembers(),
    getSubmittedBooks(),
    getCurrentBookAdmin(),
    getClubConfig(),
  ]);

  return (
    <AuthShell>
      <AdminPanel members={members} submittedBooks={submittedBooks} currentBook={currentBook} clubSettings={clubSettings} />
    </AuthShell>
  );
}
