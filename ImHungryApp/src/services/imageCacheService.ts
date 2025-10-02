import { Image } from 'react-native';

class ImageCacheService {
  private static instance: ImageCacheService;
  private preloadedImages: Set<string> = new Set();

  static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  async preloadImage(imageSource: any): Promise<void> {
    const uri = Image.resolveAssetSource(imageSource).uri;
    if (!this.preloadedImages.has(uri)) {
      await Image.prefetch(uri);
      this.preloadedImages.add(uri);
    }
  }
}

export default ImageCacheService;
