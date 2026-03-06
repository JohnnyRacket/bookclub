import { requireAdmin } from '@/lib/actions/admin';
import { listMembers } from '@/lib/actions/admin';
import { getSubmittedBooks, getCurrentBookAdmin } from '@/lib/actions/admin-books';
import { getClubConfig } from '@/lib/actions/settings';
import { getCustomReactions } from '@/lib/actions/reactions';
import { getOpenVotingSession } from '@/lib/actions/book-selection';
import { AdminPanel } from '@/components/auth/AdminPanel';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function AdminPage() {
  await requireAdmin();
  const [members, submittedBooks, currentBook, clubSettings, customReactions, openSession] = await Promise.all([
    listMembers(),
    getSubmittedBooks(),
    getCurrentBookAdmin(),
    getClubConfig(),
    getCustomReactions(),
    getOpenVotingSession(),
  ]);

  return (
    <AuthShell>
      <AdminPanel
        members={members}
        submittedBooks={submittedBooks}
        currentBook={currentBook}
        clubSettings={clubSettings}
        customReactions={customReactions}
        openSession={openSession}
        hasAdminPin={!!process.env.ADMIN_PIN}
      />
    </AuthShell>
  );
}
