import Navbar from '@/components/shared/Navbar';
import { fetchUserProfile } from '@/app/actions/profileActions';
import { notFound } from 'next/navigation';
import IdCard from '@/components/ui/IdCard';
import { Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Calendar, Edit, User as UserIcon, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminProfileControls from '@/components/ui/AdminProfileControls';
import { toTitleCase, toUpperCase } from '@/lib/formatters';
import { fetchFormConfigs } from '@/app/actions/formActions';
import { Layers } from 'lucide-react';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const profileId = resolvedParams.id;
  const profile = await fetchUserProfile(profileId) as any;
  const configs = await fetchFormConfigs();

  if (!profile) {
    notFound();
  }

  // Filter custom fields to show in profile
  const customToDisplay = configs.filter(c => 
    c.fieldName.startsWith('custom_') && 
    c.showInProfile === 1 && 
    c.isVisible === 1 &&
    (c.categoryScope === 'all' || c.categoryScope.includes(profile.category || 'guest'))
  );

  const isDoctor = profile.category === 'doctor';
  const isStudent = profile.category === 'student';
  const details: any = profile.details || {};

  const session = await getServerSession(authOptions) as any;
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin' || session?.user?.role === 'editor';
  const isOwner = session?.user?.id === profileId;
  const canEdit = isAdmin || isOwner;

  // Helper to safely render values (handling Date objects from DB)
  const formatVal = (val: any) => {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val.toLocaleDateString();
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  };

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
                  category={profile.category}
                  membershipType={profile.membershipType}
                  avatarUrl={profile.avatarUrl || undefined}
                  bloodGroup={profile.bloodGroup || undefined}
                  validUntil="Lifetime"
                  configs={configs}
                  memberData={{ ...profile, ...details }}
                />

               {isAdmin && (
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6">
                    <AdminProfileControls 
                      profileId={profile.id} 
                      isDeleted={profile.isDeleted ?? 0}
                      currentRole={profile.role}
                      currentCategory={profile.category}
                      viewerRole={session?.user?.role || 'member'}
                    />
                 </div>
               )}
            </div>

            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header Info Block */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
                <div className="mb-6 pb-6 border-b border-gray-100 flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-gray-900 mb-1">{toTitleCase(profile.fullName)}</h1>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        profile.category === 'doctor' ? 'bg-blue-100 text-blue-700' :
                        profile.category === 'student' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {toUpperCase(profile.category || 'Guest')}
                      </span>
                    </div>

                    {profile.district && profile.state && (
                      <div className="flex items-center justify-center md:justify-start gap-1.5 text-gray-500 text-sm mt-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {toTitleCase(profile.district)}, {toTitleCase(profile.state)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Member since {new Date(profile.createdAt || Date.now()).getFullYear()}</span>
                    {canEdit && (
                      <Link 
                        href={`/directory/${profile.id}/edit`}
                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </Link>
                    )}
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
                  {profile.fatherName && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <UserIcon className="w-5 h-5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Father's Name</p>
                        <p className="text-gray-900 font-medium">{toTitleCase(profile.fatherName)}</p>
                      </div>
                    </div>
                  )}
                  {profile.bloodGroup && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                      <span className="text-red-500 text-lg shrink-0">🩸</span>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Blood Group</p>
                        <p className="text-red-700 font-bold text-lg">{toUpperCase(profile.bloodGroup)}</p>
                      </div>
                    </div>
                  )}
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
                        <p className="font-medium text-gray-900 mt-1">{formatVal(toUpperCase(details.degree))}</p>
                      </div>
                      {details.batch && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Batch Year</p>
                          <p className="font-medium text-gray-900 mt-1">{formatVal(details.batch)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Specialization</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(toTitleCase(details.specialization)) || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Experience</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.experience)} Years</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Hospital/Clinic Name</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(toTitleCase(details.hospitalName)) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Registration No.</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.registrationNo)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Consultation Fee</p>
                        <p className="font-medium text-gray-900 mt-1">{details.consultationFee ? `₹${details.consultationFee}` : 'Variable'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Availability</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.availabilityTimings) || 'By Appointment'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Clinic Address</p>
                        <p className="font-medium text-gray-900 mt-1">{details.clinicAddress || 'Not Provided'}</p>
                      </div>
                      {details.memberships && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Professional Memberships</p>
                          <p className="font-medium text-gray-900 mt-1">{formatVal(details.memberships)}</p>
                        </div>
                      )}
                      {details.awards && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Awards & Recognition</p>
                          <p className="font-medium text-gray-900 mt-1">{formatVal(details.awards)}</p>
                        </div>
                      )}
                      {details.websiteSocialLinks && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Website / Links</p>
                          <a href={details.websiteSocialLinks} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline mt-1 block truncate">
                            {details.websiteSocialLinks}
                          </a>
                        </div>
                      )}
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
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.college)}</p>
                      </div>
                      {details.university && (
                         <div className="sm:col-span-2">
                           <p className="text-xs text-gray-500 font-semibold uppercase">University</p>
                           <p className="font-medium text-gray-900 mt-1">{formatVal(details.university)}</p>
                         </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Course</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.course)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Current Year</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.year)}</p>
                      </div>
                      {details.collegeEntryYear && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Entry Year</p>
                          <p className="font-medium text-gray-900 mt-1">{formatVal(details.collegeEntryYear)}</p>
                        </div>
                      )}
                      {details.internshipStatus && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Internship Status</p>
                          <p className="font-medium text-gray-900 mt-1 capitalize">{formatVal(details.internshipStatus?.replace('_', ' '))}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Father's Gotra</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.gotraFather) || 'Not Provided'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Mother's Gotra</p>
                        <p className="font-medium text-gray-900 mt-1">{formatVal(details.gotraMother) || 'Not Provided'}</p>
                      </div>
                      {details.gotraGrandmother && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Grandmother's Gotra</p>
                          <p className="font-medium text-gray-900 mt-1">{formatVal(details.gotraGrandmother)}</p>
                        </div>
                      )}
                      {details.bloodDonationWillingness && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Blood Donation</p>
                          <p className={`font-bold mt-1 ${details.bloodDonationWillingness === 'yes' ? 'text-red-600' : 'text-gray-900'}`}>
                            {details.bloodDonationWillingness === 'yes' ? 'Willing to Donate ❤️' : formatVal(details.bloodDonationWillingness?.replace('_', ' '))}
                          </p>
                        </div>
                      )}
                      {details.linkedinProfile && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500 font-semibold uppercase">LinkedIn Profile</p>
                          <a href={details.linkedinProfile} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline mt-1 block truncate">
                            {details.linkedinProfile}
                          </a>
                        </div>
                      )}
                      {details.futureGoals && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Future Goals</p>
                          <p className="font-medium text-gray-900 mt-1">{details.futureGoals}</p>
                        </div>
                      )}
                      {details.hobbiesInterests && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Hobbies & Interests</p>
                          <p className="font-medium text-gray-900 mt-1">{details.hobbiesInterests}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </main>
      </div>
      {/* Mobile Floating Edit Button */}
      {canEdit && (
        <Link 
          href={`/directory/${profile.id}/edit`}
          className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
          aria-label="Edit Profile"
        >
          <Edit className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
