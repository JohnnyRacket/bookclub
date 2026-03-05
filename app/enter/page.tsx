import { getClubConfig } from '@/lib/actions/settings';
import { EnterForm } from '@/components/auth/EnterForm';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function EnterPage() {
  const config = await getClubConfig();
  return (
    <AuthShell>
      <EnterForm clubName={config.name} logoUrl={config.logoUrl} />
    </AuthShell>
  );
}
