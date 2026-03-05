import { verifyAdmin } from '@/lib/actions/admin';
import { AuthShell } from '@/components/auth/AuthShell';
import { AdminLoginForm } from '@/components/auth/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <AuthShell>
      <AdminLoginForm />
    </AuthShell>
  );
}
