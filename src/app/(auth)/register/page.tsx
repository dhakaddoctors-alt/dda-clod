'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/authActions';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { compressImageTo1MB } from '@/lib/imageCompression';

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
          <h2 className="mt-2 text-center text-3xl font-extrabold text-blue-600">
            Join DDA Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select your membership type to continue
          </p>
        </div>

        {/* Role Selector Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registered as *</label>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value as 'guest' | 'doctor' | 'student')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-3 font-medium text-gray-800"
          >
            <option value="guest">Guest</option>
            <option value="doctor">Doctor</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* Dynamic Form Area */}
        <form
          className="mt-8 space-y-6"
          action={async (formData) => {
            formData.append('role', role);
            
            // Compress avatar
            const avatar = formData.get('avatar') as File;
            if (avatar && avatar.size > 0 && avatar.type.startsWith('image/')) {
              const compressedAvatar = await compressImageTo1MB(avatar);
              formData.set('avatar', compressedAvatar);
            }

            // Compress payment receipt 
            const receipt = formData.get('paymentReceipt') as File;
            if (receipt && receipt.size > 0 && receipt.type.startsWith('image/')) {
              const compressedReceipt = await compressImageTo1MB(receipt);
              formData.set('paymentReceipt', compressedReceipt);
            }

            startTransition(async () => {
              const res = await registerUser(formData);
              setMessage(res.message);
            });
          }}
        >
          {message && (
            <div className={`p-4 rounded-md text-sm font-medium ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          {/* --- COMMON FIELDS --- */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input type="text" name="fullName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                <input type="tel" name="mobile" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <input type="email" name="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2">
                  <option>Select...</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2">
                  <option>Select...</option>
                  <option>Single</option>
                  <option>Married</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Upload Profile Photo (Optional)</label>
                <input type="file" name="avatar" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input type="password" name="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
              </div>
            </div>
          </div>

          {/* --- GUEST SPECIFIC --- */}
          {role === 'guest' && (
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Guest Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Occupation</label>
                <input type="text" name="occupation" placeholder="e.g. Businessman, Teacher" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
              </div>
            </div>
          )}

          {/* --- DOCTOR SPECIFIC --- */}
          {role === 'doctor' && (
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Details (Doctor)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Degree (e.g., MBBS, MD) *</label>
                  <input type="text" name="degree" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization *</label>
                  <input type="text" name="specialization" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medical Registration No. *</label>
                  <input type="text" name="registrationNo" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                  <input type="number" name="experience" min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Primary Hospital/Clinic Name</label>
                  <input type="text" name="hospitalName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
              </div>
            </div>
          )}

          {/* --- STUDENT SPECIFIC --- */}
          {role === 'student' && (
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Academic Details (Student)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">College / Institute Name *</label>
                  <input type="text" name="college" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course Name (e.g. MBBS) *</label>
                  <input type="text" name="course" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Year/Semester *</label>
                  <input type="text" name="year" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father's Gotra</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother's Gotra</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 border p-2" />
                </div>
              </div>
            </div>
          )}

          {/* --- PAYMENT & VERIFICATION SECTION (Non-Guests) --- */}
          {role !== 'guest' && (
            <div className="space-y-4 pt-6 mt-6 border-t-2 border-dashed border-gray-200">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <span>💳</span> Membership Payment & Verification
              </h3>

              {/* Membership Tier Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Membership Tier *</label>
                <select name="membershipType" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border p-3 font-medium text-gray-800">
                  <option value="member">Normal member</option>
                  <option value="2_year">2-Year Member </option>
                  <option value="aajivan">Aajivan Member - 15 Yrs </option>
                  <option value="patron">Patron / Sanrakshak </option>
                  <option value="vishisht">Vishisht Sadasya </option>
                </select>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start gap-6">
                {/* Dummy QR Code */}
                <div className="bg-white p-2 rounded-lg shadow-sm w-32 h-32 flex-shrink-0 flex justify-center items-center border border-gray-200">
                  <div className="text-center text-xs text-gray-400">Scan QR Code<br />(UPI Placeholder)</div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Bank Details for Transfer</h4>
                  <p className="text-sm text-gray-600 font-mono mb-4">
                    Bank: State Bank of India<br />
                    A/C: 1234567890<br />
                    IFSC: SBIN0001234<br />
                    Name: DDA Medical Association
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Upload Payment Receipt / ScreenShot *</label>
                    <input type="file" name="paymentReceipt" required accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 bg-white p-1 rounded-md border" />
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
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
        </main>
      </div>
    </div>
  );
}
