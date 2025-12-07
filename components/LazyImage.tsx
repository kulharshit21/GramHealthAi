
import React, { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g., 'aspect-video', 'aspect-square'
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className = "", aspectRatio = "aspect-square", ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-xl ${aspectRatio} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
           <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
           <Loader2 size={24} className="animate-spin relative z-10" />
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
            <ImageOff size={24} className="mb-2"/>
            <span className="text-xs">Failed to load</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true); }}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};
