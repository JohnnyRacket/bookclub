import { isPinlessMode } from '@/lib/actions/admin';
import { AuthShell } from '@/components/auth/AuthShell';
import { AdminLoginForm } from '@/components/auth/AdminLoginForm';

export default async function AdminLoginPage() {
  const pinless = await isPinlessMode();
  return (
    <AuthShell>
      <AdminLoginForm pinless={pinless} />
    </AuthShell>
  );
}
