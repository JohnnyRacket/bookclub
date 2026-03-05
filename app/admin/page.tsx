import { requireAdmin, listMembers } from '@/lib/actions/admin';
import { getSubmittedBooks, getCurrentBookAdmin } from '@/lib/actions/admin-books';
import { getClubConfig } from '@/lib/actions/settings';
import { getCustomReactions } from '@/lib/actions/reactions';
import { AdminPanel } from '@/components/auth/AdminPanel';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function AdminPage() {
  await requireAdmin();
  const [members, submittedBooks, currentBook, clubSettings, customReactions] = await Promise.all([
    listMembers(),
    getSubmittedBooks(),
    getCurrentBookAdmin(),
    getClubConfig(),
    getCustomReactions(),
  ]);

  return (
    <AuthShell>
      <AdminPanel members={members} submittedBooks={submittedBooks} currentBook={currentBook} clubSettings={clubSettings} customReactions={customReactions} />
    </AuthShell>
  );
}
