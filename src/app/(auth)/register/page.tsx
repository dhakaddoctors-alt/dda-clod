'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/authActions';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { compressImageTo1MB } from '@/lib/imageCompression';

const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2 text-sm";
const labelClass = "block text-sm font-medium text-gray-700";
const sectionClass = "space-y-4 pt-4";
const sectionTitle = "text-lg font-semibold text-gray-900 border-b pb-2 mb-4";

export default function RegisterPage() {
  const [role, setRole] = useState<'guest' | 'doctor' | 'student'>('guest');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full flex justify-center py-12">
          <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div>
              <h2 className="mt-2 text-center text-3xl font-extrabold text-blue-600">Join DDA Portal</h2>
              <p className="mt-2 text-center text-sm text-gray-600">Fill in all details to complete your registration</p>
            </div>

            {/* Role Selector */}
            <div>
              <label className={labelClass}>Register As *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'guest' | 'doctor' | 'student')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-3 font-medium text-gray-800"
              >
                <option value="guest">Guest</option>
                <option value="doctor">Doctor</option>
                <option value="student">Student</option>
              </select>
            </div>

            <form
              className="space-y-6"
              action={async (formData) => {
                const password = formData.get('password') as string;
                const confirmPassword = formData.get('confirmPassword') as string;

                if (password !== confirmPassword) {
                  setMessage('Passwords do not match');
                  return;
                }

                formData.append('role', role);
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
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input type="text" name="fullName" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Mobile Number *</label>
                    <input type="tel" name="mobile" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input type="email" name="email" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input type="date" name="dob" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select name="gender" className={inputClass}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Marital Status</label>
                    <select name="maritalStatus" className={inputClass}>
                      <option value="">Select...</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Password *</label>
                    <input type="password" name="password" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password *</label>
                    <input type="password" name="confirmPassword" required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Profile Photo (Optional)</label>
                    <input type="file" name="avatar" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>
              </div>

              {/* ── GUEST SPECIFIC ───────────────────────────────── */}
              {role === 'guest' && (
                <div className={sectionClass}>
                  <h3 className={sectionTitle}>Guest Details</h3>
                  <div>
                    <label className={labelClass}>Current Occupation</label>
                    <input type="text" name="occupation" placeholder="e.g. Businessman, Teacher" className={inputClass} />
                  </div>
                </div>
              )}

              {/* ── DOCTOR SPECIFIC ──────────────────────────────── */}
              {role === 'doctor' && (
                <div className={sectionClass}>
                  <h3 className={sectionTitle}>Professional Details (Doctor)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Degree (e.g. MBBS, MD) *</label>
                      <input type="text" name="degree" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Specialization (Optional)</label>
                      <input type="text" name="specialization" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Medical Registration No. *</label>
                      <input type="text" name="registrationNo" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Experience (Years)</label>
                      <input type="number" name="experience" min="0" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Hospital / Clinic Name</label>
                      <input type="text" name="hospitalName" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Present Working Place</label>
                      <input type="text" name="presentWorkingPlace" placeholder="City or Institution" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Consultation Fee (₹)</label>
                      <input type="number" name="consultationFee" min="0" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Availability Timings</label>
                      <input type="text" name="availabilityTimings" placeholder="e.g. Mon-Fri 10am-5pm" className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Clinic Address</label>
                      <input type="text" name="clinicAddress" className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Memberships / Associations</label>
                      <input type="text" name="memberships" placeholder="e.g. IMA, DDA, etc." className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Awards & Achievements</label>
                      <input type="text" name="awards" placeholder="Any notable awards or recognition" className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Website / Social Links</label>
                      <input type="text" name="websiteSocialLinks" placeholder="e.g. https://linkedin.com/in/..." className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STUDENT SPECIFIC ─────────────────────────────── */}
              {role === 'student' && (
                <div className={sectionClass}>
                  <h3 className={sectionTitle}>Academic Details (Student)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>College / Institute Name *</label>
                      <input type="text" name="college" required className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>University</label>
                      <input type="text" name="university" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Course (e.g. MBBS) *</label>
                      <input type="text" name="course" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Current Year / Semester *</label>
                      <input type="text" name="year" placeholder="e.g. 3rd Year" required className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>College Entry Year</label>
                      <input type="number" name="collegeEntryYear" placeholder="e.g. 2022" min="2000" max="2030" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Internship Status</label>
                      <select name="internshipStatus" className={inputClass}>
                        <option value="">Select...</option>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Father's Gotra</label>
                      <input type="text" name="gotraFather" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Mother's Gotra</label>
                      <input type="text" name="gotraMother" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Grandmother's Gotra</label>
                      <input type="text" name="gotraGrandmother" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Blood Donation Willingness</label>
                      <select name="bloodDonationWillingness" className={inputClass}>
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>LinkedIn Profile</label>
                      <input type="text" name="linkedinProfile" placeholder="https://linkedin.com/in/..." className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Hobbies & Interests</label>
                      <input type="text" name="hobbiesInterests" placeholder="e.g. Reading, Sports" className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Future Goals</label>
                      <textarea name="futureGoals" rows={3} placeholder="Your aspirations in the medical field..." className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAYMENT SECTION (non-guests) ─────────────────── */}
              {role !== 'guest' && (
                <div className="space-y-4 pt-6 mt-6 border-t-2 border-dashed border-gray-200">
                  <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <span>💳</span> Membership Payment & Verification
                  </h3>

                  <div>
                    <label className={labelClass}>Select Membership Tier *</label>
                    <select name="membershipType" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-3 font-medium text-gray-800">
                      <option value="member">Normal Member (Annual)</option>
                      <option value="2_year">2-Year Member</option>
                      <option value="aajivan">Aajivan Member (15 Years)</option>
                      <option value="patron">Patron / Sanrakshak</option>
                      <option value="vishisht">Vishisht Sadasya</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start gap-6">
                    <div className="bg-white p-3 rounded-lg shadow-sm w-56 h-56 flex-shrink-0 flex flex-col justify-center items-center border border-gray-200">
                      <img src="/qr-code.png" alt="Payment QR Code" className="w-full h-full object-contain" />
                      <div className="text-xs text-gray-500 mt-2 font-medium"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Bank Details for Transfer</h4>
                      <p className="text-sm text-gray-600 font-mono mb-4">
                        Bank: BANK OF BARODA<br />
                        A/C: 36580100010383<br />
                        IFSC: BARB0KESKOT<br />
                        Name: DHAKAD DOCTORS ASSOCIATION
                      </p>
                      <div>
                        <label className={labelClass}>Upload Payment Receipt / Screenshot (Optional)</label>
                        <input type="file" name="paymentReceipt" accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 bg-white p-1 rounded-md border" />
                      </div>
                    </div>
                  </div>
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
