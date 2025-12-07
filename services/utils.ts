

export const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
};

/**
 * Compresses an image file to WebP format for optimal performance.
 * Falls back to JPEG if WebP is not supported by the browser context (rare).
 */
export const compressImage = async (file: File, maxSizeMB: number = 2): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If already small and optimal format, skip
    if (file.size / 1024 / 1024 < 0.5 && file.type === 'image/webp') return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions (max 1280px for mobile optimization)
      const maxWidth = 1280; 
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      // Attempt WebP compression first
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            // Fallback to JPEG if WebP fails
             canvas.toBlob((jpegBlob) => {
                 if(jpegBlob) {
                     resolve(new File([jpegBlob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                 } else {
                     reject(new Error("Compression failed"));
                 }
             }, 'image/jpeg', 0.7);
          }
        },
        'image/webp',
        0.75 // Quality setting: Good balance for medical images
      );
    };
    img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
    };
  });
};

export const speakText = (text: string, langCode: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  }
};

export const requestMediaPermissions = async (): Promise<boolean> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // Stop tracks immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (err) {
        console.warn("Media permissions denied", err);
        return false;
    }
};

// --- Caching System ---

const CACHE_PREFIX = 'gh_cache_';
const CACHE_TTL_MINUTES = 60 * 24; // 24 hours

interface CacheItem<T> {
    value: T;
    expiry: number;
}

export const setCache = <T>(key: string, data: T) => {
    try {
        const item: CacheItem<T> = {
            value: data,
            expiry: Date.now() + CACHE_TTL_MINUTES * 60 * 1000
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
        
        // Cleanup old cache items to save space
        cleanupCache();
    } catch (e) {
        console.warn('Cache storage failed (quota exceeded?)', e);
    }
};

export const getCache = <T>(key: string): T | null => {
    try {
        const itemStr = localStorage.getItem(CACHE_PREFIX + key);
        if (!itemStr) return null;

        const item: CacheItem<T> = JSON.parse(itemStr);
        if (Date.now() > item.expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return item.value;
    } catch (e) {
        return null;
    }
};

const cleanupCache = () => {
    // Rudimentary cleanup: Remove items older than now
    // In a real app, we might check total storage usage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            try {
                const item = JSON.parse(localStorage.getItem(key) || '{}');
                if (item.expiry && Date.now() > item.expiry) {
                    localStorage.removeItem(key);
                }
            } catch (e) { /* ignore */ }
        }
    }
};