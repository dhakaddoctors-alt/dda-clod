'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

export default function NewsSlider({ news }: { news: NewsItem[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (news.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [news.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % news.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + news.length) % news.length);

  if (news.length === 0) {
    return (
      <div className="relative w-full h-[250px] md:h-[400px] overflow-hidden rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-300 mb-6">
        <div className="text-4xl mb-2">📢</div>
        <p className="font-medium">No recent news or updates available.</p>
        <p className="text-sm">Admin can add news from the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[250px] md:h-[400px] overflow-hidden rounded-xl bg-gray-900 group">
      {news.map((item, index) => (
        <a 
          key={item.id}
          href={item.linkUrl || '#'}
          target={item.linkUrl ? "_blank" : "_self"}
          rel="noreferrer"
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
            <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">Latest Update</span>
            <h2 className="text-2xl md:text-3xl font-bold">{item.title}</h2>
          </div>
        </a>
      ))}
      
      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 p-2 rounded-full text-white opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 p-2 rounded-full text-white opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
