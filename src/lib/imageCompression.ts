import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to be under 1MB.
 * @param file The original File object
 * @returns A Promise resolving to the compressed File object (or original if it fails/is already small)
 */
export async function compressImageTo1MB(file: File): Promise<File> {
  // If not an image, just return the original file
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // If already under 1MB, we can just return it to save processing
  // 1MB = 1048576 bytes
  if (file.size <= 1048576) {
    return file;
  }

  const options = {
    maxSizeMB: 1, // Max size in MB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true, // Use a background worker to avoid blocking the main thread
    initialQuality: 0.8,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert Blob back to File
    const compressedFile = new File([compressedBlob], file.name, {
      type: compressedBlob.type,
      lastModified: Date.now(),
    });
    return compressedFile;
  } catch (error) {
    console.error('Error during image compression:', error);
    // Fallback to original file if compression fails
    return file;
  }
}
