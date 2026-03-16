'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserProfile } from '@/app/actions/profileActions';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Camera, Save, ArrowLeft, Loader2 } from 'lucide-react';

interface EditProfileFormProps {
  profile: any;
  isAdmin?: boolean;
  canChangeCategory?: boolean;
}

export default function EditProfileForm({ profile, isAdmin, canChangeCategory }: EditProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl || null);
  const [category, setCategory] = useState(profile.category || 'guest');

  const isDoctor = category === 'doctor';
  const isStudent = category === 'student';
  const details = profile.details || {};

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    formData.append('profileId', profile.id);
    formData.append('category', category); // Use state value
    formData.append('role', profile.role); // Keep role for consistency if needed

    startTransition(async () => {
      const result = await updateUserProfile(formData);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => router.push(`/directory/${profile.id}`), 1500);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-16 z-20 bg-gray-50/80 backdrop-blur-md py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Save Changes</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-medium animate-in fade-in slide-in-from-top-2">
          {success}
        </div>
      )}

      {/* Avatar Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 relative">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300">
                {profile.fullName?.charAt(0)}
              </div>
            )}
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
              <input type="file" name="avatar" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </div>
          <p className="mt-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Change Photo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="space-y-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Personal Details
            </h3>
            {canChangeCategory && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identify As</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 focus:outline-none"
                >
                  <option value="guest">Guest</option>
                  <option value="student">Student</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Full Name</label>
              <input 
                type="text" 
                name="fullName" 
                defaultValue={profile.fullName} 
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    defaultValue={profile.email} 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Mobile</label>
                  <input 
                    type="tel" 
                    name="mobile" 
                    defaultValue={profile.mobile} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Gender</label>
                  <select 
                    name="gender" 
                    defaultValue={profile.gender || ''}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Marital Status</label>
                  <select 
                    name="maritalStatus" 
                    defaultValue={profile.maritalStatus || ''}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Date of Birth</label>
              <input 
                type="date" 
                name="dob" 
                defaultValue={profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Location & Other */}
        <div className="space-y-6 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-red-600" /> Location & Other
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">State</label>
                  <input 
                    type="text" 
                    name="state" 
                    defaultValue={profile.state || ''}
                    placeholder="e.g. Rajasthan"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">District</label>
                  <input 
                    type="text" 
                    name="district" 
                    defaultValue={profile.district || ''}
                    placeholder="e.g. Jaipur"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                  />
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Occupation (for Guest/Member)</label>
              <input 
                type="text" 
                name="occupation" 
                defaultValue={profile.occupation || ''}
                placeholder="What do you do?"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Role Specific Details */}
      {(isDoctor || isStudent) && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            {isDoctor ? <Briefcase className="w-6 h-6 text-blue-600" /> : <GraduationCap className="w-6 h-6 text-purple-600" />}
            {isDoctor ? 'Professional Details' : 'Academic Details'}
          </h3>

          {isDoctor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Degree</label>
                <input type="text" name="degree" defaultValue={details.degree || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Specialization</label>
                <input type="text" name="specialization" defaultValue={details.specialization || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Hospital/Clinic Name</label>
                <input type="text" name="hospitalName" defaultValue={details.hospitalName || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Registration No.</label>
                <input type="text" name="registrationNo" defaultValue={details.registrationNo || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Experience (Years)</label>
                <input type="number" name="experience" defaultValue={details.experience || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Clinic Address</label>
                <textarea name="clinicAddress" defaultValue={details.clinicAddress || ''} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">College Name</label>
                <input type="text" name="college" defaultValue={details.college || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">University</label>
                <input type="text" name="university" defaultValue={details.university || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Course</label>
                <input type="text" name="course" defaultValue={details.course || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Year</label>
                <input type="text" name="year" defaultValue={details.year || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Father's Gotra</label>
                  <input type="text" name="gotraFather" defaultValue={details.gotraFather || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Mother's Gotra</label>
                  <input type="text" name="gotraMother" defaultValue={details.gotraMother || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button (Repeat at bottom for mobile) */}
      <div className="md:hidden">
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          <span>Save Profile Changes</span>
        </button>
      </div>
    </form>
  );
}
