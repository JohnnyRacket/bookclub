import { getClubConfig } from '@/lib/actions/settings';
import { JoinForm } from '@/components/auth/JoinForm';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function JoinPage() {
  const config = await getClubConfig();
  return (
    <AuthShell>
      <JoinForm clubName={config.name} />
    </AuthShell>
  );
}
