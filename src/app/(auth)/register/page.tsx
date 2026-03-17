'use client';
import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/authActions';
import Navbar from '@/components/shared/Navbar';
import { compressImageTo1MB } from '@/lib/imageCompression';
import DynamicUPIQR from '@/components/ui/DynamicUPIQR';
import { User, Stethoscope, GraduationCap, CheckCircle2 } from 'lucide-react';
import { toTitleCase, toUpperCase } from '@/lib/formatters';
import { fetchFormConfigs } from '@/app/actions/formActions';

interface Config {
  id: string;
  fieldName: string;
  label: string;
  section: string;
  isVisible: number;
  isRequired: number;
  fieldType: string;
  options?: string;
}

const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2 text-sm";
const labelClass = "block text-sm font-medium text-gray-700";
const sectionClass = "space-y-4 pt-4";
const sectionTitle = "text-lg font-semibold text-gray-900 border-b pb-2 mb-4";

export default function RegisterPage() {
  const [category, setCategory] = useState<'doctor' | 'student' | 'guest'>('doctor');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [configs, setConfigs] = useState<Config[]>([]);

  useEffect(() => {
    fetchFormConfigs().then(data => setConfigs(data as any));
  }, []);

  const getField = (name: string) => configs.find(c => c.fieldName === name);
  const isVisible = (name: string) => getField(name)?.isVisible !== 0; // Default visible if not found
  const isRequired = (name: string) => getField(name)?.isRequired === 1;

  const identities = [
    { id: 'guest', label: 'Guest', icon: User, key: 'category_guest' },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope, key: 'category_doctor' },
    { id: 'student', label: 'Student', icon: GraduationCap, key: 'category_student' },
  ].filter(identity => isVisible(identity.key));

  useEffect(() => {
    // If current category is hidden, switch to first visible one
    if (identities.length > 0 && !identities.find(i => i.id === category)) {
      setCategory(identities[0].id as any);
    }
  }, [configs, category, identities]);

  function DynamicField({ config }: { config: Config }) {
    if (config.isVisible === 0) return null;

    const label = config.label;
    const isReq = config.isRequired === 1;
    const name = config.fieldName;
    const type = config.fieldType || 'text';

    let InputComponent;

    if (type === 'select') {
      const options = config.options ? config.options.split(',').map(o => o.trim()) : [];
      InputComponent = (
        <select name={name} required={isReq} className={inputClass}>
          <option value="">Select...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    } else if (type === 'textarea') {
      InputComponent = (
        <textarea name={name} required={isReq} rows={3} className={inputClass} />
      );
    } else {
      InputComponent = (
        <input type={type} name={name} required={isReq} className={inputClass} />
      );
    }

    return (
      <div className={name.startsWith('custom_') ? 'md:col-span-2' : ''}>
        <label className={labelClass}>{label} {isReq && '*'}</label>
        {InputComponent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <main className="flex-1 p-4 lg:p-8 w-full flex justify-center py-12">
          <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div>
              <h2 className="mt-2 text-center text-3xl font-extrabold text-blue-600">Join DDA Portal</h2>
              <p className="mt-1 text-center text-sm text-gray-500">Select your registration type below</p>
            </div>

            {/* Segmented Identity Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">I am a...</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {identities.map((r) => {
                  const Icon = r.icon;
                  const isActive = category === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCategory(r.id as any)}
                      className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all duration-200 group ${isActive
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-50'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 shadow-sm'
                        }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                        }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors leading-none text-center ${isActive ? 'text-blue-900' : 'text-gray-500'}`}>
                        {r.label.split(' ')[0]}
                      </span>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 text-blue-600">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              className="space-y-6"
              action={async (formData) => {
                const password = formData.get('password') as string;

                const handleFormatTitleCase = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  e.target.value = toTitleCase(e.target.value);
                };

                const handleFormatUpperCase = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  e.target.value = toUpperCase(e.target.value);
                };
                const confirmPassword = formData.get('confirmPassword') as string;

                if (password !== confirmPassword) {
                  setMessage('Passwords do not match');
                  return;
                }

                formData.append('category', category);
                const avatar = formData.get('avatar') as File;
                if (avatar && avatar.size > 0 && avatar.type.startsWith('image/')) {
                  formData.set('avatar', await compressImageTo1MB(avatar));
                }
                const receipt = formData.get('paymentReceipt') as File;
                if (receipt && receipt.size > 0 && receipt.type.startsWith('image/')) {
                  formData.set('paymentReceipt', await compressImageTo1MB(receipt));
                }
                startTransition(async () => {
                  const res = await registerUser(formData);
                  setMessage(res.message);
                });
              }}
            >
              {message && (
                <div className={`p-4 rounded-md text-sm font-medium ${message.includes('success') || message.includes('submitted') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}

              {/* ── BASIC INFO ──────────────────────────────────── */}
              <div className={sectionClass}>
                <h3 className={sectionTitle}>Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isVisible('fullName') && (
                    <div>
                      <label className={labelClass}>{getField('fullName')?.label || 'Full Name'} {isRequired('fullName') && '*'}</label>
                      <input type="text" name="fullName" required={isRequired('fullName')} onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                    </div>
                  )}
                  {isVisible('fatherName') && (
                    <div>
                      <label className={labelClass}>{getField('fatherName')?.label || "Father's Name"} {isRequired('fatherName') && '*'}</label>
                      <input type="text" name="fatherName" required={isRequired('fatherName')} onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                    </div>
                  )}
                  {isVisible('mobile') && (
                    <div>
                      <label className={labelClass}>{getField('mobile')?.label || 'Mobile Number'} {isRequired('mobile') && '*'}</label>
                      <input type="tel" name="mobile" required={isRequired('mobile')} className={inputClass} />
                    </div>
                  )}
                  {isVisible('email') && (
                    <div>
                      <label className={labelClass}>{getField('email')?.label || 'Email Address'} {isRequired('email') && '*'}</label>
                      <input type="email" name="email" required={isRequired('email')} className={inputClass} />
                    </div>
                  )}
                  {isVisible('dob') && (
                    <div>
                      <label className={labelClass}>{getField('dob')?.label || 'Date of Birth'} {isRequired('dob') && '*'}</label>
                      <input type="date" name="dob" required={isRequired('dob')} className={inputClass} />
                    </div>
                  )}
                  {isVisible('gender') && (
                    <div>
                      <label className={labelClass}>{getField('gender')?.label || 'Gender'} {isRequired('gender') && '*'}</label>
                      <select name="gender" required={isRequired('gender')} className={inputClass}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                  {isVisible('maritalStatus') && (
                    <div>
                      <label className={labelClass}>{getField('maritalStatus')?.label || 'Marital Status'} {isRequired('maritalStatus') && '*'}</label>
                      <select name="maritalStatus" required={isRequired('maritalStatus')} className={inputClass}>
                        <option value="">Select...</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>
                  )}
                  {isVisible('bloodGroup') && (
                    <div>
                      <label className={labelClass}>{getField('bloodGroup')?.label || 'Blood Group'} {isRequired('bloodGroup') && '*'}</label>
                      <select name="bloodGroup" required={isRequired('bloodGroup')} className={inputClass}>
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  )}
                  {isVisible('state') && (
                    <div>
                      <label className={labelClass}>{getField('state')?.label || 'State / UT'} {isRequired('state') && '*'}</label>
                      <select name="state" required={isRequired('state')} className={inputClass}>
                        <option value="">Select State or Union Territory</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value=" Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Delhi">Delhi (NCT)</option>
                        <option value="Chandigarh">Chandigarh (UT)</option>
                        <option value="Jammu and Kashmir">Jammu & Kashmir (UT)</option>
                        <option value="Ladakh">Lad Ladakh (UT)</option>
                      </select>
                    </div>
                  )}
                  {isVisible('district') && (
                    <div>
                      <label className={labelClass}>{getField('district')?.label || 'District'} {isRequired('district') && '*'}</label>
                      <input type="text" name="district" required={isRequired('district')} placeholder="e.g. Indore, Jaipur, Kota" onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Password *</label>
                    <input type="password" name="password" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password *</label>
                    <input type="password" name="confirmPassword" required className={inputClass} />
                  </div>
                  {isVisible('avatar') && (
                    <div>
                      <label className={labelClass}>{getField('avatar')?.label || 'Profile Photo'} {isRequired('avatar') && '*'}</label>
                      <input type="file" name="avatar" accept="image/*" required={isRequired('avatar')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                  )}
                  {/* Dynamic Custom Fields for Basic section */}
                  {configs.filter(c => c.section === 'basic' && c.fieldName.startsWith('custom_')).map(config => (
                    <DynamicField key={config.id} config={config} />
                  ))}
                </div>
              </div>

              {/* ── GUEST SPECIFIC ───────────────────────────────── */}
              {category === 'guest' && (
                <div className={sectionClass}>
                  <h3 className={sectionTitle}>Guest Details</h3>
                  {isVisible('occupation') && (
                    <div>
                      <label className={labelClass}>{getField('occupation')?.label || 'Current Occupation'} {isRequired('occupation') && '*'}</label>
                      <input type="text" name="occupation" required={isRequired('occupation')} placeholder="e.g. Businessman, Teacher" onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                    </div>
                  )}
                  {/* Dynamic Custom Fields for Guest section */}
                  {configs.filter(c => c.section === 'guest' && c.fieldName.startsWith('custom_')).map(config => (
                    <DynamicField key={config.id} config={config} />
                  ))}
                </div>
              )}

              {/* ── DOCTOR SPECIFIC ──────────────────────────────── */}
              {category === 'doctor' && (
                <div className={sectionClass}>
                  <h3 className={sectionTitle}>Professional Details (Doctor)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isVisible('degree') && (
                      <div>
                        <label className={labelClass}>{getField('degree')?.label || 'Medical Degree'} {isRequired('degree') && '*'}</label>
                        <input type="text" name="degree" required={isRequired('degree')} onBlur={(e) => { e.target.value = toUpperCase(e.target.value) }} className={inputClass} placeholder="e.g. MBBS, MD, BDS" />
                      </div>
                    )}
                    {isVisible('batch') && (
                      <div>
                        <label className={labelClass}>{getField('batch')?.label || 'Batch Year'} {isRequired('batch') && '*'}</label>
                        <input type="text" name="batch" required={isRequired('batch')} className={inputClass} placeholder="e.g. 2012" />
                      </div>
                    )}
                    {isVisible('specialization') && (
                      <div>
                        <label className={labelClass}>{getField('specialization')?.label || 'Specialization'} {isRequired('specialization') && '*'}</label>
                        <input type="text" name="specialization" required={isRequired('specialization')} onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                      </div>
                    )}
                    {isVisible('registrationNo') && (
                      <div>
                        <label className={labelClass}>{getField('registrationNo')?.label || 'Medical Registration No.'} {isRequired('registrationNo') && '*'}</label>
                        <input type="text" name="registrationNo" required={isRequired('registrationNo')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('experience') && (
                      <div>
                        <label className={labelClass}>{getField('experience')?.label || 'Experience (Years)'} {isRequired('experience') && '*'}</label>
                        <input type="number" name="experience" min="0" required={isRequired('experience')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('hospitalName') && (
                      <div>
                        <label className={labelClass}>{getField('hospitalName')?.label || 'Hospital / Clinic Name'} {isRequired('hospitalName') && '*'}</label>
                        <input type="text" name="hospitalName" required={isRequired('hospitalName')} onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                      </div>
                    )}
                    {isVisible('presentWorkingPlace') && (
                      <div>
                        <label className={labelClass}>{getField('presentWorkingPlace')?.label || 'Present Working Place'} {isRequired('presentWorkingPlace') && '*'}</label>
                        <input type="text" name="presentWorkingPlace" required={isRequired('presentWorkingPlace')} placeholder="City or Institution" className={inputClass} />
                      </div>
                    )}
                    {isVisible('consultationFee') && (
                      <div>
                        <label className={labelClass}>{getField('consultationFee')?.label || 'Consultation Fee (₹)'} {isRequired('consultationFee') && '*'}</label>
                        <input type="number" name="consultationFee" min="0" required={isRequired('consultationFee')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('availabilityTimings') && (
                      <div>
                        <label className={labelClass}>{getField('availabilityTimings')?.label || 'Availability Timings'} {isRequired('availabilityTimings') && '*'}</label>
                        <input type="text" name="availabilityTimings" required={isRequired('availabilityTimings')} placeholder="e.g. Mon-Fri 10am-5pm" className={inputClass} />
                      </div>
                    )}
                    {isVisible('clinicAddress') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('clinicAddress')?.label || 'Clinic Address'} {isRequired('clinicAddress') && '*'}</label>
                        <input type="text" name="clinicAddress" required={isRequired('clinicAddress')} onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                      </div>
                    )}
                    {isVisible('permanentAddress') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('permanentAddress')?.label || 'Permanent Address'} {isRequired('permanentAddress') && '*'}</label>
                        <textarea name="permanentAddress" rows={2} required={isRequired('permanentAddress')} placeholder="Village/Town, District, State, PIN" className={inputClass} />
                      </div>
                    )}
                    {isVisible('currentAddress') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('currentAddress')?.label || 'Current Address (if different)'} {isRequired('currentAddress') && '*'}</label>
                        <textarea name="currentAddress" rows={2} required={isRequired('currentAddress')} placeholder="Current working/residing address" className={inputClass} />
                      </div>
                    )}
                    {isVisible('memberships') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('memberships')?.label || 'Memberships / Associations'} {isRequired('memberships') && '*'}</label>
                        <input type="text" name="memberships" required={isRequired('memberships')} placeholder="e.g. IMA, DDA, etc." className={inputClass} />
                      </div>
                    )}
                    {isVisible('awards') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('awards')?.label || 'Awards & Achievements'} {isRequired('awards') && '*'}</label>
                        <input type="text" name="awards" required={isRequired('awards')} placeholder="Any notable awards or recognition" className={inputClass} />
                      </div>
                    )}
                    {isVisible('websiteSocialLinks') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('websiteSocialLinks')?.label || 'Website / Social Links'} {isRequired('websiteSocialLinks') && '*'}</label>
                        <input type="text" name="websiteSocialLinks" required={isRequired('websiteSocialLinks')} placeholder="e.g. https://linkedin.com/in/..." className={inputClass} />
                      </div>
                    )}
                    {/* Dynamic Custom Fields for Doctor section */}
                    {configs.filter(c => c.section === 'doctor' && c.fieldName.startsWith('custom_')).map(config => (
                      <DynamicField key={config.id} config={config} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── STUDENT SPECIFIC ─────────────────────────────── */}
              {category === 'student' && (
                <div className={sectionClass}>
                  <h3 className={sectionTitle}>Academic Details (Student)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isVisible('college') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('college')?.label || 'College / Institute Name'} {isRequired('college') && '*'}</label>
                        <input type="text" name="college" required={isRequired('college')} onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                      </div>
                    )}
                    {isVisible('university') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('university')?.label || 'University'} {isRequired('university') && '*'}</label>
                        <input type="text" name="university" required={isRequired('university')} onBlur={(e) => { e.target.value = toTitleCase(e.target.value) }} className={inputClass} />
                      </div>
                    )}
                    {isVisible('course') && (
                      <div>
                        <label className={labelClass}>{getField('course')?.label || 'Course (e.g. MBBS)'} {isRequired('course') && '*'}</label>
                        <input type="text" name="course" required={isRequired('course')} onBlur={(e) => { e.target.value = toUpperCase(e.target.value) }} className={inputClass} />
                      </div>
                    )}
                    {isVisible('year') && (
                      <div>
                        <label className={labelClass}>{getField('year')?.label || 'Current Year / Semester'} {isRequired('year') && '*'}</label>
                        <input type="text" name="year" placeholder="e.g. 3rd Year" required={isRequired('year')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('collegeEntryYear') && (
                      <div>
                        <label className={labelClass}>{getField('collegeEntryYear')?.label || 'College Entry Year'} {isRequired('collegeEntryYear') && '*'}</label>
                        <input type="number" name="collegeEntryYear" placeholder="e.g. 2022" min="2000" max="2030" required={isRequired('collegeEntryYear')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('internshipStatus') && (
                      <div>
                        <label className={labelClass}>{getField('internshipStatus')?.label || 'Internship Status'} {isRequired('internshipStatus') && '*'}</label>
                        <select name="internshipStatus" required={isRequired('internshipStatus')} className={inputClass}>
                          <option value="">Select...</option>
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    )}
                    {isVisible('gotraFather') && (
                      <div>
                        <label className={labelClass}>{getField('gotraFather')?.label || "Father's Gotra"} {isRequired('gotraFather') && '*'}</label>
                        <input type="text" name="gotraFather" required={isRequired('gotraFather')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('gotraMother') && (
                      <div>
                        <label className={labelClass}>{getField('gotraMother')?.label || "Mother's Gotra"} {isRequired('gotraMother') && '*'}</label>
                        <input type="text" name="gotraMother" required={isRequired('gotraMother')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('gotraGrandmother') && (
                      <div>
                        <label className={labelClass}>{getField('gotraGrandmother')?.label || "Grandmother's Gotra"} {isRequired('gotraGrandmother') && '*'}</label>
                        <input type="text" name="gotraGrandmother" required={isRequired('gotraGrandmother')} className={inputClass} />
                      </div>
                    )}
                    {isVisible('bloodDonationWillingness') && (
                      <div>
                        <label className={labelClass}>{getField('bloodDonationWillingness')?.label || 'Blood Donation Willingness'} {isRequired('bloodDonationWillingness') && '*'}</label>
                        <select name="bloodDonationWillingness" required={isRequired('bloodDonationWillingness')} className={inputClass}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    )}
                    {isVisible('linkedinProfile') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('linkedinProfile')?.label || 'LinkedIn Profile'} {isRequired('linkedinProfile') && '*'}</label>
                        <input type="text" name="linkedinProfile" required={isRequired('linkedinProfile')} placeholder="https://linkedin.com/in/..." className={inputClass} />
                      </div>
                    )}
                    {isVisible('hobbiesInterests') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('hobbiesInterests')?.label || 'Hobbies & Interests'} {isRequired('hobbiesInterests') && '*'}</label>
                        <input type="text" name="hobbiesInterests" required={isRequired('hobbiesInterests')} placeholder="e.g. Reading, Sports" className={inputClass} />
                      </div>
                    )}
                    {isVisible('futureGoals') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('futureGoals')?.label || 'Future Goals'} {isRequired('futureGoals') && '*'}</label>
                        <textarea name="futureGoals" rows={3} required={isRequired('futureGoals')} placeholder="Your aspirations in the medical field..." className={inputClass} />
                      </div>
                    )}
                    {isVisible('permanentAddress') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('permanentAddress')?.label || 'Permanent Address'} {isRequired('permanentAddress') && '*'}</label>
                        <textarea name="permanentAddress" rows={2} required={isRequired('permanentAddress')} placeholder="Village/Town, District, State, PIN" className={inputClass} />
                      </div>
                    )}
                    {isVisible('currentAddress') && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>{getField('currentAddress')?.label || 'Current Address (Hostel / Rental)'} {isRequired('currentAddress') && '*'}</label>
                        <textarea name="currentAddress" rows={2} required={isRequired('currentAddress')} placeholder="Current residing / hostel address" className={inputClass} />
                      </div>
                    )}
                    {/* Dynamic Custom Fields for Student section */}
                    {configs.filter(c => c.section === 'student' && c.fieldName.startsWith('custom_')).map(config => (
                      <DynamicField key={config.id} config={config} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── PAYMENT SECTION (non-guests) ─────────────────── */}
              {category !== 'guest' && (
                <div className="space-y-4 pt-6 mt-6 border-t-2 border-dashed border-gray-200">
                  <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <span>💳</span> Membership Payment & Verification
                  </h3>

                  {isVisible('membershipType') && (
                    <div>
                      <label className={labelClass}>{getField('membershipType')?.label || 'Select Membership Tier'} {isRequired('membershipType') ? '*' : '(Optional)'}</label>
                      <select name="membershipType" required={isRequired('membershipType')} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-3 font-medium text-gray-800">
                        <option value="member">Normal Member (Annual)</option>
                        <option value="2_year">2-Year Member</option>
                        <option value="aajivan">Aajivan Member (15 Years)</option>
                        <option value="patron">Patron / Sanrakshak</option>
                        <option value="vishisht">Vishisht Sadasya</option>
                      </select>
                    </div>
                  )}

                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <DynamicUPIQR
                        upiId="dhak9660383@barodampay"
                        name="DHAKAD DOCTORS ASSOCIATION"
                        className="w-48 h-48 sm:w-56 sm:h-56 mb-4"
                      />
                      <a
                        href="upi://pay?pa=dhak9660383@barodampay&pn=DHAKAD DOCTORS ASSOCIATION&cu=INR"
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-full font-bold text-sm hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                      >
                        <span>📱 Open in UPI App</span>
                      </a>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Bank Details for Transfer</h4>
                      <p className="text-sm text-gray-600 font-mono mb-4">
                        Bank: BANK OF BARODA<br />
                        A/C: 36580100010383<br />
                        IFSC: BARB0KESKOT<br />
                        UPI ID:dhak9660383@barodampay<br />
                        Name: DHAKAD DOCTORS ASSOCIATION
                      </p>
                      {isVisible('paymentReceipt') && (
                        <div>
                          <label className={labelClass}>{getField('paymentReceipt')?.label || 'Upload Payment Receipt / Screenshot'} {isRequired('paymentReceipt') ? '*' : '(Optional)'}</label>
                          <input type="file" name="paymentReceipt" accept="image/*,application/pdf" required={isRequired('paymentReceipt')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 bg-white p-1 rounded-md border" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Dynamic Custom Fields for Payment section */}
                  {configs.filter(c => c.section === 'payment' && c.fieldName.startsWith('custom_')).map(config => (
                    <div className="mt-4" key={config.id}>
                      <DynamicField config={config} />
                    </div>
                  ))}
                  <p className="text-xs text-red-600 font-medium">Note: Your profile will remain pending UNTIL the admin verifies your payment receipt manually.</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors
                    ${isPending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
                  `}
                >
                  {isPending ? 'Submitting...' : 'Submit Registration for Approval'}
                </button>
                <p className="mt-4 text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Log in</Link>
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
