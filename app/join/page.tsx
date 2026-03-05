import { clubConfig } from '@/lib/config';
import { JoinForm } from '@/components/auth/JoinForm';
import { AuthShell } from '@/components/auth/AuthShell';

export default function JoinPage() {
  return (
    <AuthShell>
      <JoinForm clubName={clubConfig.name} />
    </AuthShell>
  );
}
