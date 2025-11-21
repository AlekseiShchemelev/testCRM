// src/utils/imageUtils.ts

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxFileSize?: number; // в байтах
  outputFormat?: 'jpeg' | 'webp' | 'png';
}

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

/**
 * Сжимает изображение до указанных параметров
 */
export const compressImage = (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 400,
      maxHeight = 300,
      quality = 0.5,
      maxFileSize = 40 * 1024, // 50KB
      outputFormat = 'jpeg'
    } = options;

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Не удалось создать canvas контекст'));
            return;
          }

          // Вычисляем новые размеры с соотношением сторон
          let { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
          
          if (ratio < 1) {
            width *= ratio;
            height *= ratio;
          }

          // Устанавливаем размеры canvas
          canvas.width = width;
          canvas.height = height;

          // Рисуем изображение на canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Получаем data URL с указанным качеством
          let dataUrl: string;
          let currentQuality = quality;
          
          // Пробуем разные уровни качества для достижения нужного размера
          do {
            dataUrl = canvas.toDataURL(`image/${outputFormat}`, currentQuality);
            const dataSize = Math.round((dataUrl.length * 3) / 4); // примерный размер в байтах
            
            if (dataSize <= maxFileSize || currentQuality <= 0.1) {
              break;
            }
            
            currentQuality -= 0.1;
          } while (true);

          const compressedSize = Math.round((dataUrl.length * 3) / 4);
          const compressionRatio = ((file.size - compressedSize) / file.size) * 100;

          resolve({
            dataUrl,
            originalSize: file.size,
            compressedSize,
            compressionRatio,
            width,
            height
          });
        } catch (error) {
          reject(new Error(`Ошибка при сжатии изображения: ${error}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Не удалось загрузить изображение'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Не удалось прочитать файл'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Валидирует изображение
 */
export const validateImageFile = (
  file: File,
  options: {
    maxFileSize?: number;
    allowedTypes?: string[];
  } = {}
): { isValid: boolean; error?: string } => {
  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Неподдерживаемый формат. Разрешены: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxFileSize) {
    const maxSizeMB = Math.round(maxFileSize / 1024 / 1024);
    const fileSizeMB = Math.round(file.size / 1024 / 1024 * 100) / 100;
    return {
      isValid: false,
      error: `Размер файла (${fileSizeMB} МБ) превышает максимальный (${maxSizeMB} МБ)`
    };
  }

  return { isValid: true };
};

/**
 * Обрабатывает массив файлов с сжатием
 */
export const processImageFiles = async (
  files: FileList | File[],
  compressionOptions: ImageCompressionOptions = {},
  validationOptions = {}
): Promise<{
  successful: CompressionResult[];
  errors: string[];
}> => {
  const fileArray = Array.from(files);
  const successful: CompressionResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    
    // Валидация
    const validation = validateImageFile(file, validationOptions);
    if (!validation.isValid) {
      errors.push(`${file.name}: ${validation.error}`);
      continue;
    }

    try {
      const result = await compressImage(file, compressionOptions);
      successful.push(result);
    } catch (error) {
      errors.push(`${file.name}: Ошибка при обработке - ${error}`);
    }
  }

  return { successful, errors };
};

/**
 * Получает информацию об изображении без сжатия
 */
export const getImageInfo = (file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type
      });
    };

    img.onerror = () => {
      reject(new Error('Не удалось получить информацию об изображении'));
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Не удалось прочитать файл'));
    };
    reader.readAsDataURL(file);
  });
};
