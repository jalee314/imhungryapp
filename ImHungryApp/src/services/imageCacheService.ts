import { Image } from 'react-native';

class ImageCacheService {
  private static instance: ImageCacheService;
  private preloadedImages: Set<string> = new Set();
  private maxCacheSize: number = 50; // Limit cache size
  private cacheOrder: string[] = []; // LRU tracking

  static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  async preloadImage(imageSource: any): Promise<void> {
    const uri = Image.resolveAssetSource(imageSource).uri;
    if (!this.preloadedImages.has(uri)) {
      try {
        await Image.prefetch(uri);
        this.preloadedImages.add(uri);
        this.cacheOrder.push(uri);
        
        // Implement LRU cache eviction
        if (this.preloadedImages.size > this.maxCacheSize) {
          const oldestUri = this.cacheOrder.shift();
          if (oldestUri) {
            this.preloadedImages.delete(oldestUri);
          }
        }
      } catch (error) {
        console.warn('Failed to preload image:', uri, error);
      }
    } else {
      // Move to end of cache order (most recently used)
      const index = this.cacheOrder.indexOf(uri);
      if (index > -1) {
        this.cacheOrder.splice(index, 1);
        this.cacheOrder.push(uri);
      }
    }
  }

  // Preload multiple images with priority
  async preloadImages(imageSources: any[], priority: 'high' | 'low' = 'low'): Promise<void> {
    const batchSize = priority === 'high' ? 3 : 1;
    
    for (let i = 0; i < imageSources.length; i += batchSize) {
      const batch = imageSources.slice(i, i + batchSize);
      await Promise.all(batch.map(source => this.preloadImage(source)));
      
      // Add delay for low priority to not block UI
      if (priority === 'low' && i + batchSize < imageSources.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Clear cache to free memory
  clearCache(): void {
    this.preloadedImages.clear();
    this.cacheOrder = [];
  }

  // Get cache stats
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.preloadedImages.size,
      maxSize: this.maxCacheSize
    };
  }
}

export default ImageCacheService;
