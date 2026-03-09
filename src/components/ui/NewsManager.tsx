'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Image as ImageIcon, Loader2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { createNews, deleteNews, toggleNewsStatus } from '@/app/actions/newsActions';

interface NewsItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: number | null;
  createdAt: Date;
}

export default function NewsManager({ initialNews }: { initialNews: NewsItem[] }) {
  const router = useRouter();
  const [newsList, setNewsList] = useState(initialNews);
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', linkUrl: '' });
  const [file, setFile] = useState<File | null>(null);

  // Sync state if initialNews changes
  useEffect(() => {
    setNewsList(initialNews);
  }, [initialNews]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please select an image');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('linkUrl', formData.linkUrl);
    data.append('imageFile', file);

    startTransition(async () => {
      const res = await createNews(data);
      if (res.success) {
        setShowAddModal(false);
        setFormData({ title: '', linkUrl: '' });
        setFile(null);
        router.refresh(); 
      } else {
        alert(res.message);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return;
    startTransition(async () => {
      const res = await deleteNews(id);
      if (res.success) {
        setNewsList(prev => prev.filter(item => item.id !== id));
        router.refresh();
      }
    });
  };

  const handleToggle = async (id: string, current: number) => {
    startTransition(async () => {
      const res = await toggleNewsStatus(id, current);
      if (res.success) {
        setNewsList(prev => prev.map(item => 
          item.id === id ? { ...item, isActive: current === 1 ? 0 : 1 } : item
        ));
        router.refresh();
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-blue-50/50">
        <h2 className="text-lg font-bold text-gray-900">Manage News Slider</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Add News
        </button>
      </div>

      <div className="p-6">
        {newsList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No news items found. Add your first announcement!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newsList.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden group">
                <div className="h-32 bg-gray-100 relative">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => handleToggle(item.id, item.isActive || 0)}
                      className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 transition"
                      title={item.isActive ? "Hide from slider" : "Show in slider"}
                    >
                      {item.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {item.isActive === 0 && (
                    <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Hidden</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">{item.linkUrl || 'No link'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add News Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Announcement</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title / Caption</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., National Conference 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slider Image</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{file ? file.name : 'Upload banner image'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChangeCapture={e => setFile((e.target as any).files[0])} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Click Link (Optional)</label>
                <input 
                  type="url" 
                  value={formData.linkUrl}
                  onChange={e => setFormData({...formData, linkUrl: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com/more-info"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-blue-400"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish to Slider'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
