'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DUMMY_NEWS: any[] = [];

export default function NewsSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % DUMMY_NEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % DUMMY_NEWS.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + DUMMY_NEWS.length) % DUMMY_NEWS.length);

  if (DUMMY_NEWS.length === 0) {
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
      {DUMMY_NEWS.map((news, index) => (
        <div 
          key={news.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img src={news.image} alt={news.title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
            <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block">Latest News</span>
            <h2 className="text-2xl md:text-3xl font-bold">{news.title}</h2>
          </div>
        </div>
      ))}
      
      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
