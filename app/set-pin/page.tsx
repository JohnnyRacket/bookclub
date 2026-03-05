import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { SetPinForm } from '@/components/auth/SetPinForm';
import { AuthShell } from '@/components/auth/AuthShell';

export default async function SetPinPage() {
  const session = await getSession();
  if (!session || !session.pinReset) redirect('/');

  return (
    <AuthShell>
      <SetPinForm name={session.name} />
    </AuthShell>
  );
}
