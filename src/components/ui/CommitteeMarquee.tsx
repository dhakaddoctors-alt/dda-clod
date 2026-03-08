'use client';
import { Building2 } from 'lucide-react';

const DUMMY_COMMITTEES: any[] = [];

export default function CommitteeMarquee() {
  if (DUMMY_COMMITTEES.length === 0) return null;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden my-4 relative shadow-sm">
      <div className="bg-blue-600 text-white p-3 font-semibold flex items-center gap-2 absolute left-0 top-0 bottom-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.1)]">
        <Building2 className="w-5 h-5" />
        <span className="hidden sm:inline">Committees</span>
      </div>
      
      {/* CSS Animation Class applied via Tailwind plugins or globals.css later */}
      <div className="flex overflow-hidden group py-3 ml-12 sm:ml-40 bg-gray-50/50">
        <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap items-center hover:[animation-play-state:paused]">
          {/* We duplicate the array to create a seamless infinite loop */}
          {[...DUMMY_COMMITTEES, ...DUMMY_COMMITTEES].map((member, index) => (
            <div key={`${member.id}-${index}`} className="flex flex-col mx-4 px-4 border-l-2 border-l-gray-300">
              <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{member.name}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 rounded-full">{member.role}</span>
                <span className="text-xs text-gray-500 font-medium">({member.level})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
