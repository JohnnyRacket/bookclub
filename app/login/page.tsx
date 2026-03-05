import { getClubConfig } from '@/lib/actions/settings';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const [{ name }, config] = await Promise.all([searchParams, getClubConfig()]);
  return (
    <AuthShell>
      <LoginForm clubName={config.name} initialName={name} />
    </AuthShell>
  );
}
