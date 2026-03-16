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
  
