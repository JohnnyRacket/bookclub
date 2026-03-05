import { clubConfig } from '@/lib/config';
import { EnterForm } from '@/components/auth/EnterForm';
import { AuthShell } from '@/components/auth/AuthShell';

export default function EnterPage() {
  return (
    <AuthShell>
      <EnterForm clubName={clubConfig.name} logoUrl={clubConfig.logoUrl} />
    </AuthShell>
  );
}
