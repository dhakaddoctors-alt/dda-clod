'use client';

import { useState, useEffect } from 'react';
import { 
  fetchFormConfigs, 
  updateFormConfig, 
  initializeFormConfigs, 
  addFormConfig, 
  deleteFormConfig,
  updateFormConfigsOrder
} from '@/app/actions/formActions';
import { 
  Eye, 
  EyeOff, 
  ClipboardCheck, 
  ClipboardX, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Layers,
  Search,
  Zap,
  Layout,
  FileText,
  Contact2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FormConfig {
  id: string;
  fieldName: string;
  label: string;
  section: string;
  isVisible: number;
  isRequired: number;
  categoryScope: string;
  fieldType: string;
  options?: string | null;
  storageMode: string;
  showInProfile: number;
  showInPdf: number;
  showInDirectory: number;
  orderIndex: number;
}

interface AdminRegistrationManagerProps {
  viewerRole?: string;
}

export default function AdminRegistrationManager({ viewerRole }: AdminRegistrationManagerProps) {
  const [configs, setConfigs] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [newFieldMode, setNewFieldMode] = useState<'json' | 'meta' | 'column'>('json');

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    const data = await fetchFormConfigs();
    setConfigs(data as any);
    setLoading(false);
  }

  async function handleToggle(id: string, field: keyof FormConfig, currentVal: any) {
    setSaving(id);
    const newVal = typeof currentVal === 'number' ? (currentVal === 1 ? 0 : 1) : currentVal;
    const res = await updateFormConfig(id, { [field]: newVal });
    if (res.success) {
      setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: newVal } : c));
      toast.success('Updated successfully');
    } else {
      toast.error(res.message || 'Update failed');
    }
    setSaving(null);
  }

  async function handleUpdateField(id: string, updates: Partial<FormConfig>) {
    setSaving(id);
    const res = await updateFormConfig(id, updates as any);
    if (res.success) {
      setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Field updated');
    } else {
      toast.error(res.message || 'Update failed');
    }
    setSaving(null);
  }

  async function handleAddField(section: string) {
    const res = await addFormConfig(section, 'all', newFieldMode);
    if (res.success) {
      await loadConfigs();
      toast.success(`${newFieldMode.toUpperCase()} field added`);
      setAddingToSection(null);
    } else {
      toast.error(res.message);
    }
  }

  async function handleDeleteField(id: string) {
    if (!confirm('Are you sure you want to delete this custom field?')) return;
    const res = await deleteFormConfig(id);
    if (res.success) {
      setConfigs(prev => prev.filter(c => c.id !== id));
      toast.success('Field deleted');
    } else {
      toast.error(res.message);
    }
  }

  async function handleInitialize() {
    if (!confirm('This will ensure all default fields exist. Continue?')) return;
    setLoading(true);
    await initializeFormConfigs();
    await loadConfigs();
    toast.success('System fields initialized');
  }

  async function handleMove(id: string, direction: 'up' | 'down', section: string) {
    const sectionConfigs = configs
      .filter(c => c.section === section)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const index = sectionConfigs.findIndex(c => c.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionConfigs.length) return;

    const newOrder = [...sectionConfigs];
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    const updates = newOrder.map((c, i) => ({ id: c.id, orderIndex: (i + 1) * 10 }));

    // Optimistic UI update
    setConfigs(prev => {
      const others = prev.filter(c => c.section !== section);
      const updated = prev
        .filter(c => c.section === section)
        .map(c => {
          const u = updates.find(up => up.id === c.id);
          return u ? { ...c, orderIndex: u.orderIndex } : c;
        })
        .sort((a, b) => a.orderIndex - b.orderIndex);
      return [...others, ...updated];
    });

    const res = await updateFormConfigsOrder(updates);
    if (!res.success) {
      toast.error('Failed to save order');
      loadConfigs();
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading configurations...</div>;

  const sections = ['visibility', 'basic', 'guest', 'doctor', 'student', 'payment'];

  return (
    <div className="space-y-8 p-4 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registration Form Builder</h2>
          <p className="text-gray-500">Add, Remove, or Customize registration fields and questions.</p>
        </div>
        <button 
          onClick={handleInitialize}
          className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-all text-sm font-semibold whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" /> Reset / Default Fields
        </button>
      </div>

      {sections.map(section => {
        const sectionConfigs = configs.filter(c => c.section === section);

        return (
          <div key={section} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-600 uppercase tracking-[0.2em]">
                {section} Details
              </h3>
              <div className="flex items-center gap-2">
                <select 
                  value={newFieldMode}
                  onChange={(e) => setNewFieldMode(e.target.value as any)}
                  className="text-[10px] font-bold border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                >
                  <option value="json">Standard (JSON)</option>
                  <option value="meta">Searchable (Meta)</option>
                  <option value="column">Advanced (Column)</option>
                </select>
                <button 
                  onClick={() => handleAddField(section)}
                  className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-colors uppercase tracking-wider shadow-sm"
                >
                  <Plus className="w-3 h-3" /> Add Field
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {sectionConfigs.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No fields in this section.</div>
              ) : (
                sectionConfigs.map(config => (
                  <div key={config.id} className="p-5 flex flex-col md:flex-row gap-4 hover:bg-slate-50/50 transition-colors group/row">
                    
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1 pr-2 border-r border-gray-100">
                      <button 
                        onClick={() => handleMove(config.id, 'up', section)}
                        className="p-1 hover:bg-blue-50 text-gray-300 hover:text-blue-600 rounded transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleMove(config.id, 'down', section)}
                        className="p-1 hover:bg-blue-50 text-gray-300 hover:text-blue-600 rounded transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Left: Metadata & Label Edit */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          defaultValue={config.label}
                          onBlur={(e) => {
                            if (e.target.value !== config.label) {
                              handleUpdateField(config.id, { label: e.target.value });
                            }
                          }}
                          className="bg-transparent text-gray-900 font-bold text-base border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1 transition-all w-full max-w-sm"
                        />
                        {/* Custom Field Badge */}
                        {config.fieldName.startsWith('custom_') && (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black uppercase">Dynamic</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-mono">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">ID: {config.id}</span>
                        <span>Key: {config.fieldName}</span>
                        <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                           {config.storageMode === 'column' ? <Zap className="w-3 h-3" /> : config.storageMode === 'meta' ? <Search className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                           <span className="font-bold uppercase">{config.storageMode}</span>
                        </div>
                        <span>Scope: {config.categoryScope}</span>
                      </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                      
                      {/* Type Selector */}
                      <select 
                        value={config.fieldType || 'text'}
                        onChange={(e) => handleUpdateField(config.id, { fieldType: e.target.value })}
                        className="text-[11px] font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown (Select)</option>
                        <option value="textarea">Large Text</option>
                      </select>

                      {/* Options for Select */}
                      {config.fieldType === 'select' && (
                        <input 
                          type="text"
                          placeholder="Options: Choice1, Choice2"
                          defaultValue={config.options || ''}
                          onBlur={(e) => handleUpdateField(config.id, { options: e.target.value })}
                          className="text-[11px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none w-40"
                          title="Enter comma-separated choices"
                        />
                      )}

                      <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

                      {/* Display Location Toggles */}
                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                        <button
                          onClick={() => handleToggle(config.id, 'showInProfile', config.showInProfile)}
                          title="Show in Member Profile"
                          className={`p-1.5 rounded-md transition-all ${config.showInProfile === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-300'}`}
                        >
                          <Contact2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(config.id, 'showInDirectory', config.showInDirectory)}
                          title="Show in Member Directory"
                          className={`p-1.5 rounded-md transition-all ${config.showInDirectory === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-300'}`}
                        >
                          <Layout className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(config.id, 'showInPdf', config.showInPdf)}
                          title="Include in PDF Export"
                          className={`p-1.5 rounded-md transition-all ${config.showInPdf === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-300'}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

                      {/* Visibility Toggle */}
                      <button
                        onClick={() => handleToggle(config.id, 'isVisible', config.isVisible)}
                        disabled={saving === config.id}
                        title="Form Visibility"
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                          config.isVisible === 1 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-50' 
                          : 'bg-white text-gray-400 border-gray-200 grayscale'
                        }`}
                      >
                        {config.isVisible === 1 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {config.isVisible === 1 ? 'FORM:ON' : 'FORM:OFF'}
                      </button>

                      {/* Required Toggle */}
                      <button
                        onClick={() => handleToggle(config.id, 'isRequired', config.isRequired)}
                        disabled={saving === config.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                          config.isRequired === 1 
                          ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm shadow-amber-50' 
                          : 'bg-white text-blue-500 border-blue-100'
                        }`}
                      >
                        {config.isRequired === 1 ? <ClipboardCheck className="w-3 h-3" /> : <ClipboardX className="w-3 h-3" />}
                        {config.isRequired === 1 ? 'REQ' : 'OPT'}
                      </button>

                      {/* Delete Custom Field */}
                      {config.fieldName.startsWith('custom_') && (
                        (config.storageMode !== 'column' || viewerRole === 'super_admin') ? (
                          <button 
                            onClick={() => handleDeleteField(config.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div title="Only Super Admin can delete columns" className="p-1.5 opacity-20 cursor-not-allowed">
                             <Trash2 className="w-4 h-4 text-gray-400" />
                          </div>
                        )
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

