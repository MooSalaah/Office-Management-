// نظام تحسين الصور والملفات
export interface ImageOptimizationOptions {
  quality?: number; // 0-100
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  width?: number;
  height?: number;
  placeholder?: 'blur' | 'empty';
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export interface FileOptimizationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  compression?: boolean;
}

// Image optimization utilities
export const imageOptimization = {
  // Generate optimized image URL
  getOptimizedImageUrl(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    const {
      quality = 85,
      format = 'auto',
      width,
      height,
      placeholder = 'empty'
    } = options;

    // If using Next.js Image component, return original src
    if (src.startsWith('/') || src.startsWith('http')) {
      return src;
    }

    // For external images, you might want to use a CDN or image optimization service
    // This is a placeholder implementation
    const params = new URLSearchParams();
    if (quality !== 85) params.append('q', quality.toString());
    if (format !== 'auto') params.append('f', format);
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (placeholder !== 'empty') params.append('p', placeholder);

    return params.toString() ? `${src}?${params.toString()}` : src;
  },

  // Check if image is loaded
  isImageLoaded(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  },

  // Preload image
  preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  },

  // Generate blur placeholder
  generateBlurPlaceholder(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient as placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f0f0f0');
      gradient.addColorStop(1, '#e0e0e0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/jpeg', 0.1);
  },

  // Lazy load images in viewport
  lazyLoadImages(selector: string = 'img[data-src]'): void {
    if (typeof window === 'undefined') return;

    const images = document.querySelectorAll(selector);
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  },

  // Optimize image dimensions
  getOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  },
};

// File optimization utilities
export const fileOptimization = {
  // Check file size
  getFileSize(file: File): number {
    return file.size;
  },

  // Check if file type is allowed
  isAllowedFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.startsWith(type);
    });
  },

  // Compress file (basic implementation)
  async compressFile(
    file: File,
    options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
  ): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file; // Only compress images
    }

    const { quality = 0.8, maxWidth, maxHeight } = options;
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Resize if needed
        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  },

  // Validate file
  validateFile(
    file: File,
    options: FileOptimizationOptions = {}
  ): { valid: boolean; error?: string } {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options; // 10MB default

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      };
    }

    if (allowedTypes.length > 0 && !this.isAllowedFileType(file, allowedTypes)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  },
};

// React hooks for image optimization
export const useImageOptimization = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const loadImage = useCallback(async (src: string): Promise<boolean> => {
    try {
      const success = await imageOptimization.isImageLoaded(src);
      if (success) {
        setLoadedImages(prev => new Set(prev).add(src));
      } else {
        setFailedImages(prev => new Set(prev).add(src));
      }
      return success;
    } catch (error) {
      setFailedImages(prev => new Set(prev).add(src));
      return false;
    }
  }, []);

  const preloadImage = useCallback(async (src: string): Promise<void> => {
    try {
      await imageOptimization.preloadImage(src);
      setLoadedImages(prev => new Set(prev).add(src));
    } catch (error) {
      setFailedImages(prev => new Set(prev).add(src));
      throw error;
    }
  }, []);

  const isImageLoaded = useCallback((src: string): boolean => {
    return loadedImages.has(src);
  }, [loadedImages]);

  const isImageFailed = useCallback((src: string): boolean => {
    return failedImages.has(src);
  }, [failedImages]);

  return {
    loadImage,
    preloadImage,
    isImageLoaded,
    isImageFailed,
    loadedImages: Array.from(loadedImages),
    failedImages: Array.from(failedImages),
  };
};

// React hook for file optimization
export const useFileOptimization = () => {
  const [compressedFiles, setCompressedFiles] = useState<Map<string, File>>(new Map());
  const [compressionProgress, setCompressionProgress] = useState<Map<string, number>>(new Map());

  const compressFile = useCallback(async (
    file: File,
    options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
  ): Promise<File> => {
    const fileId = `${file.name}-${file.lastModified}`;
    
    // Check if already compressed
    if (compressedFiles.has(fileId)) {
      return compressedFiles.get(fileId)!;
    }

    setCompressionProgress(prev => new Map(prev).set(fileId, 0));
    
    try {
      const compressed = await fileOptimization.compressFile(file, options);
      setCompressedFiles(prev => new Map(prev).set(fileId, compressed));
      setCompressionProgress(prev => new Map(prev).set(fileId, 100));
      return compressed;
    } catch (error) {
      setCompressionProgress(prev => new Map(prev).delete(fileId));
      throw error;
    }
  }, [compressedFiles]);

  const validateFile = useCallback((
    file: File,
    options: FileOptimizationOptions = {}
  ): { valid: boolean; error?: string } => {
    return fileOptimization.validateFile(file, options);
  }, []);

  return {
    compressFile,
    validateFile,
    compressionProgress: Object.fromEntries(compressionProgress),
    compressedFiles: Object.fromEntries(compressedFiles),
  };
};

// Auto-initialize lazy loading
if (typeof window !== 'undefined') {
  // Initialize lazy loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      imageOptimization.lazyLoadImages();
    });
  } else {
    imageOptimization.lazyLoadImages();
  }

  // Re-initialize lazy loading when new content is added
  const observer = new MutationObserver(() => {
    imageOptimization.lazyLoadImages();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export default {
  imageOptimization,
  fileOptimization,
  useImageOptimization,
  useFileOptimization,
}; 