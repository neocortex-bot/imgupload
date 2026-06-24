export async function compressImage(file: File, maxSizeKB: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate the width and height, constraining the proportions
        if (width > height) {
          if (width > 1600) {
            height *= 1600 / width;
            width = 1600;
          }
        } else {
          if (height > 1600) {
            width *= 1600 / height;
            height = 1600;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Decrease quality until file size is less than maxSizeKB
        let quality = 0.9;
        let compressedFile: Blob;
        
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                compressedFile = blob;
                if (compressedFile.size > maxSizeKB * 1024 && quality > 0.1) {
                  quality -= 0.1;
                  compress();
                } else {
                  resolve(compressedFile);
                }
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        compress();
      };
    };
    reader.onerror = (error) => reject(error);
  });
}

