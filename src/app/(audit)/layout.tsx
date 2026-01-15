import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AuditNav } from '@/components/audit';

export default async function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen bg-[#fefcf3] font-mono">
      <AuditNav />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
