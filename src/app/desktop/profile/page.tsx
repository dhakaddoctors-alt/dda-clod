import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function ProfileRedirectPage() {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;
  
  if (userId) {
    redirect(`/directory/${userId}`);
  } else {
    // Fallback if ID is somehow missing
    redirect('/');
  }
}
