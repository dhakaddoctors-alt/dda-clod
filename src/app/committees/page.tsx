import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { Layers, ChevronDown, Users, Search } from 'lucide-react';

export default function CommitteesPage() {
  const committeeStructure = [
    {
      level: 'National Committee',
      members: [
        { id: 1, name: 'Dr. Ramesh Kumar', role: 'President', location: 'Delhi' },
        { id: 2, name: 'Dr. Sunita Sharma', role: 'Vice President', location: 'Mumbai' },
        { id: 3, name: 'Dr. Anil Gupta', role: 'Secretary', location: 'Jaipur' },
      ]
    },
    {
      level: 'State Committee (Rajasthan)',
      members: [
        { id: 4, name: 'Dr. Vikram Singh', role: 'State President', location: 'Jaipur' },
        { id: 5, name: 'Dr. Meena Patil', role: 'State Secretary', location: 'Jodhpur' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full">
          <div className="max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-blue-600" />
                  Committee Structure
                </h1>
                <p className="text-gray-600 mt-1">Hierarchical view of all DDA working committees</p>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search members or roles..."
                  className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
                />
              </div>
            </div>

            {/* Hierarchical List */}
            <div className="space-y-6">
              {committeeStructure.map((committee, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Committee Header */}
                  <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        <Users className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-800">{committee.level}</h2>
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                        {committee.members.length} Members
                      </span>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  {/* Committee Members Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {committee.members.map(member => (
                      <div key={member.id} className="border border-gray-100 rounded-lg p-3 flex items-start gap-3 hover:border-blue-300 hover:shadow-sm transition-all bg-white cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{member.name}</h3>
                          <p className="text-xs font-medium text-blue-600 mt-0.5">{member.role}</p>
                          <p className="text-xs text-gray-500 mt-1">{member.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
