'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Users, PlusCircle } from 'lucide-react';

interface CommitteeMember {
  id: string;
  name: string;
  designation: string;
}

interface CommitteeTier {
  id: string;
  title: string;
  members: CommitteeMember[];
}

// Initial Mock Data Structure for a Committee
const initialData: CommitteeTier[] = [
  {
    id: 'tier-1',
    title: 'National Executive Core',
    members: [
      { id: 'm-1', name: 'Dr. Ramesh Kumar', designation: 'President' },
      { id: 'm-2', name: 'Dr. Suresh Dhakad', designation: 'General Secretary' },
    ]
  },
  {
    id: 'tier-2',
    title: 'State Presidents',
    members: [
      { id: 'm-3', name: 'Dr. Alok Sharma', designation: 'MP State Head' },
      { id: 'm-4', name: 'Dr. Neha Nagar', designation: 'Rajasthan State Head' },
    ]
  },
  {
    id: 'tier-3',
    title: 'District Coordinators',
    members: [
      { id: 'm-5', name: 'Dr. Vikas Verma', designation: 'Indore Coordinator' },
      { id: 'm-6', name: 'Priya Singh', designation: 'Jaipur Student Rep' },
    ]
  }
];

export default function CommitteeBuilder() {
  const [tiers, setTiers] = useState<CommitteeTier[]>(initialData);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped back into same original slot
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceTierIndex = tiers.findIndex(t => t.id === source.droppableId);
    const destTierIndex = tiers.findIndex(t => t.id === destination.droppableId);

    const newTiers = [...tiers];
    const sourceMembers = [...newTiers[sourceTierIndex].members];
    const destMembers = source.droppableId === destination.droppableId ? sourceMembers : [...newTiers[destTierIndex].members];

    // Remove from source
    const [movedMember] = sourceMembers.splice(source.index, 1);

    // Insert to destination
    destMembers.splice(destination.index, 0, movedMember);

    // Update state
    newTiers[sourceTierIndex].members = sourceMembers;
    if (source.droppableId !== destination.droppableId) {
      newTiers[destTierIndex].members = destMembers;
    }

    setTiers(newTiers);
  };

  const handleSaveHierarchy = async () => {
    // API Call to save the modified hierarchy to the Drizzle DB
    console.log('Saving new Committee Hierarchy Array:', tiers);
    alert('Hierarchy Saved Successfully! (Mock Action)');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-xl font-bold text-gray-900">Live Committee Builder</h2>
           <p className="text-sm text-gray-500">Drag and drop members to assign or reorder designations.</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
          <PlusCircle className="w-4 h-4" /> Add Tier
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {tiers.map((tier) => (
            <div key={tier.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                {tier.title} 
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{tier.members.length} Members</span>
              </h3>
              
              <Droppable droppableId={tier.id}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-[60px] rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 outline-dashed outline-2 outline-blue-300' : ''}`}
                  >
                    {tier.members.map((member, index) => (
                      <Draggable key={member.id} draggableId={member.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm mb-2 group ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 rotate-1' : 'hover:border-blue-200'}`}
                          >
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing">
                               <GripVertical className="w-5 h-5" />
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {member.name.charAt(0)}
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                            </div>
                            
                            <div>
                              {/* Designation editable badge */}
                              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100">
                                {member.designation}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {tier.members.length === 0 && !snapshot.isDraggingOver && (
                       <div className="text-center p-4 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                         Drag members here
                       </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
        <button 
           onClick={handleSaveHierarchy}
           className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-transform active:scale-95"
        >
          Save Hierarchy Configuration
        </button>
      </div>
    </div>
  );
}
