import { ImageUploader } from './components/ImageUploader'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Uploader</h1>
      <Link href="/gallery" className="text-blue-500 hover:underline mb-4 inline-block">
        View Image Gallery
      </Link>
      <ImageUploader />
    </main>
  )
}

