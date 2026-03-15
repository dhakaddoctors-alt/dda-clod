import Navbar from '@/components/shared/Navbar';
import { fetchUserProfile } from '@/app/actions/profileActions';
import EditProfileForm from '@/components/ui/EditProfileForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const profileId = resolvedParams.id;
  
  const session = await getServerSession(authOptions) as any;
  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
  const isOwner = session.user.id === profileId;

  if (!isAdmin && !isOwner) {
    redirect(`/directory/${profileId}`);
  }

  const profile = await fetchUserProfile(profileId);

  if (!profile) {
    redirect('/directory');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full">
          <EditProfileForm profile={profile} />
        </main>
      </div>
    </div>
  );
}
