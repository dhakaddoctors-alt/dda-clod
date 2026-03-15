import Navbar from '@/components/shared/Navbar';
import AdSubmissionForm from '@/components/ui/AdSubmissionForm';

export default function AdSubmissionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Grow Your Business with DDA</h1>
            <p className="text-gray-600">Submit your advertisement request below. Our team will review and promote your brand to our community.</p>
          </div>
          
          <AdSubmissionForm />
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-sm">
             <div className="p-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">High Visibility</h4>
                <p className="text-gray-500">Reach thousands of verified medical professionals and students.</p>
             </div>
             <div className="p-4">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Verified Network</h4>
                <p className="text-gray-500">Promote your services in a trusted, closed professional community.</p>
             </div>
             <div className="p-4">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Easy Setup</h4>
                <p className="text-gray-500">Quick submission process and fast approval turnaround.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
