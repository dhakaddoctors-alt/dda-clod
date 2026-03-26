export function toTitleCase(text: string | null | undefined): string {
    if (!text) return '';
    return text.toLowerCase().split(' ').map(word => {
      // Don't capitalize small words unless they are the first word (optional enhancement)
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }
  
  export function toUpperCase(text: string | null | undefined): string {
    if (!text) return '';
    return text.toUpperCase();
  }
  
  export function toSentenceCase(text: string | null | undefined): string {
    if (!text) return '';
    const trimmed = text.trim();
    if (trimmed.length === 0) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  
  export function formatTimeAgo(date: Date | string | null | undefined): string {
    if (!date) return '';
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    if (!(parsedDate instanceof Date) || isNaN(parsedDate.getTime())) return '';
    
    const seconds = Math.floor((new Date().getTime() - parsedDate.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return 'just now';
  }
