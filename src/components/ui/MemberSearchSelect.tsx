'use client';

import { useState, useEffect, useRef } from 'react';
import { searchMembersForReference } from '@/app/actions/nominationActions';
import { Search, CheckCircle, User, Loader2 } from 'lucide-react';

interface MemberSearchSelectProps {
  name: string;
  label: string;
  required?: boolean;
  excludeId?: string; // ID to exclude (e.g. they can't select themselves or the other reference)
  defaultValue?: string; // Initial ID if editing
}

export default function MemberSearchSelect({ name, label, required = true, excludeId, defaultValue }: MemberSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 3 && !selectedMember) {
        setIsLoading(true);
        const fetched = await searchMembersForReference(query);
        // Filter out excluded ID (e.g. self or other reference)
        setResults(excludeId ? fetched.filter(m => m.id !== excludeId) : fetched);
        setIsLoading(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 400); // debounce
    
    return () => clearTimeout(timer);
  }, [query, excludeId, selectedMember]);

  const handleSelect = (member: any) => {
    setSelectedMember(member);
    setQuery(member.fullName);
    setIsOpen(false);
  };

  const clearSelection = () => {
    setSelectedMember(null);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Hidden input to pass the selected ID to FormData */}
      <input type="hidden" name={name} value={selectedMember?.id || defaultValue || ''} required={required} />
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={selectedMember ? `${selectedMember.fullName} (${selectedMember.mobile})` : query}
          onChange={(e) => {
            if (selectedMember) clearSelection();
            setQuery(e.target.value);
          }}
          className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow disabled:bg-gray-100 disabled:text-gray-500"
          placeholder="Search by Name or Phone (min 3 chars)..."
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          </div>
        )}
        
        {selectedMember && (
          <button 
            type="button" 
            onClick={clearSelection}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && !selectedMember && (
        <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
          {results.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors"
            >
              <div className="bg-blue-100 text-blue-700 p-2 rounded-full shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{member.fullName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                   <span className="capitalize">{member.category}</span>
                   <span>•</span>
                   <span>{member.district || 'Anywhere'}</span>
                   <span>•</span>
                   <span>{member.mobile || 'No Phone'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {query.length >= 3 && !isLoading && results.length === 0 && isOpen && !selectedMember && (
        <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 text-center text-gray-500 text-sm">
          No verified members found matching "{query}".
        </div>
      )}
      
      {selectedMember && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-100">
          <CheckCircle className="w-4 h-4" />
          Verified Selection
        </div>
      )}
    </div>
  );
}
