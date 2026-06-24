import { readdir } from 'fs/promises'
import path from 'path'
import { ImageGallery } from '../components/ImageGallery'

export default async function GalleryPage() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const files = await readdir(uploadDir)
  const images = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Gallery</h1>
      <ImageGallery images={images} />
    </div>
  )
}

