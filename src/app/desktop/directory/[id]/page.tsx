import Navbar from '@/components/shared/Navbar';
import { fetchUserProfile } from '@/app/actions/profileActions';
import IdCard from '@/components/ui/IdCard';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Calendar } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminProfileControls from '@/components/ui/AdminProfileControls';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const profileId = resolvedParams.id;
  const profile = await fetchUserProfile(profileId);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 pt-16">
          <main className="flex-1 p-8 flex items-center justify-center w-full">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-500 mb-6">The member you are looking for does not exist or has been removed.</p>
              <Link href="/directory" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                Return to Directory
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isDoctor = profile.role === 'doctor';
  const isStudent = profile.role === 'student';
  const details: any = profile.details || {};

  const session = await getServerSession(authOptions) as any;
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - ID Card & Actions */}
            <div className="lg:col-span-1 space-y-6">
               <IdCard 
                 id={profile.id}
                 name={profile.fullName}
                 role={profile.role}
                 membershipType={profile.membershipType}
                 avatarUrl={profile.avatarUrl || undefined}
                 validUntil="Dec 2028" // Stubbed for now
               />

               {isAdmin && (
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
                    <AdminProfileControls 
                      profileId={profile.id} 
                      isDeleted={profile.isDeleted ?? 0}
                      currentRole={profile.role}
                    />
                 </div>
               )}
            </div>

            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header Info Block */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
                <div className="mb-6 pb-6 border-b border-gray-100 flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.fullName}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                      <span className="capitalize text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{profile.role}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Member since {new Date(profile.createdAt || Date.now()).getFullYear()}</span>
                    </div>
                  </div>
                  {profile.paymentStatus === 'verified' ? (
                     <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                       <Award className="w-4 h-4" /> Verified Profile
                     </span>
                  ) : (
                     <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                       Pending Verification
                     </span>
                  )}
                </div>

                {/* Contact Info Grid */}
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-gray-900 font-medium">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Mobile</p>
                      <p className="text-gray-900 font-medium">{profile.mobile || 'Confidential'}</p>
                    </div>
                  </div>
                </div>

                {/* Role Specific Info Component */}
                {isDoctor && (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" /> Professional Details
                    </h3>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Degree</p>
                        <p className="font-medium text-gray-900 mt-1">{details.degree}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Specialization</p>
                        <p className="font-medium text-gray-900 mt-1">{details.specialization}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Hospital/Clinic</p>
                        <p className="font-medium text-gray-900 mt-1">{details.hospitalName || 'Independent Practice'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Registration No.</p>
                        <p className="font-medium text-gray-900 mt-1">{details.registrationNo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Experience</p>
                        <p className="font-medium text-gray-900 mt-1">{details.experience} Years</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Clinic Address</p>
                        <p className="font-medium text-gray-900 mt-1">{details.clinicAddress || 'Not Provided'}</p>
                      </div>
                    </div>
                  </>
                )}

                {isStudent && (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-purple-600" /> Academic Details
                    </h3>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase">College / Institute</p>
                        <p className="font-medium text-gray-900 mt-1">{details.college}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Course</p>
                        <p className="font-medium text-gray-900 mt-1">{details.course}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Year</p>
                        <p className="font-medium text-gray-900 mt-1">{details.year}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1">Father's Gotra</p>
                        <p className="font-medium text-gray-900 mt-1">{details.gotraFather || 'Not Provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1">Mother's Gotra</p>
                        <p className="font-medium text-gray-900 mt-1">{details.gotraMother || 'Not Provided'}</p>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
