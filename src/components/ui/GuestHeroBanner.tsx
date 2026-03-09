import Link from 'next/link';
import { Heart, Users, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';

export default function GuestHeroBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-10 mb-8 shadow-xl border border-blue-600/30">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10 pointer-events-none">
        <Heart className="w-64 h-64 text-white" />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 opacity-10 pointer-events-none">
        <Users className="w-48 h-48 text-white" />
      </div>

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-100 text-xs font-bold uppercase tracking-wider mb-6">
          <ShieldCheck className="w-4 h-4" /> Official Platform
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
          Welcome to the Dhakad Doctors Community
        </h1>
        
        <p className="text-blue-100 sm:text-lg mb-4 font-medium leading-relaxed">
          A heartfelt welcome to the Dhakad Doctors Association – a united platform for all medical graduates from the Dhakar Samaj.
        </p>
        
        <p className="text-blue-200/90 text-sm sm:text-base mb-8 leading-relaxed max-w-2xl">
          We are dedicated to strengthening our community through professional growth, networking, knowledge sharing, and selfless service to society. From young practitioners to seasoned specialists, this is your home – a family of healers committed to excellence and compassion.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 group">
            <UserPlus className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
            Join the Community
          </Link>
          
          <Link href="/directory" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/50 text-white font-semibold rounded-xl backdrop-blur-sm transition-all active:scale-95">
            <Users className="w-5 h-5 opacity-80" />
            Find Doctors
          </Link>
          
          <Link href="/committees" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/50 text-white font-semibold rounded-xl backdrop-blur-sm transition-all active:scale-95">
            <ShieldCheck className="w-5 h-5 opacity-80" />
            Leadership
          </Link>
        </div>
      </div>
    </div>
  );
}
