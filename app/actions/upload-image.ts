'use server'

import { writeFile, mkdir, readdir, rename } from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { env } from '../env'

let sharp: typeof import('sharp') | null = null

try {
  sharp = require('sharp')
} catch (error) {
  console.warn('Failed to load sharp:', error)
  console.warn('Falling back to basic file upload without resizing')
}

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file uploaded')
  }

  let filename = formData.get('filename') as string
  if (!filename) {
    filename = file.name
  }

  // Ensure filename has an extension
  if (!path.extname(filename)) {
    filename += path.extname(file.name)
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  let filepath = path.join(uploadDir, filename)

  // Check for duplicate filenames
  const files = await readdir(uploadDir)
  let counter = 1
  while (files.includes(path.basename(filepath))) {
    const parsedFilename = path.parse(filename)
    filepath = path.join(uploadDir, `${parsedFilename.name}(${counter})${parsedFilename.ext}`)
    counter++
  }

  try {
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true })
    
    const buffer = Buffer.from(await file.arrayBuffer())

    if (sharp) {
      // Resize and save the image if sharp is available
      await sharp(buffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .toFile(filepath)
    } else {
      // Fallback: save the original file without resizing
      await writeFile(filepath, buffer)
    }
    
    return `${env.NEXT_PUBLIC_DOMAIN}/uploads/${path.basename(filepath)}`
  } catch (error) {
    console.error('Error in uploadImage:', error)
    throw new Error('Failed to upload image: ' + (error instanceof Error ? error.message : String(error)))
  }
}

const DELETE_PASSWORD = 'Admin123!'

export async function renameImage(oldPath: string, newFilename: string) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const oldFilename = oldPath.split('/').pop()
  if (!oldFilename) throw new Error('Invalid old path')

  const oldFilePath = path.join(uploadDir, oldFilename)
  let newFilePath = path.join(uploadDir, newFilename)

  // Ensure new filename has an extension
  if (!path.extname(newFilename)) {
    newFilePath += path.extname(oldFilename)
  }

  try {
    await rename(oldFilePath, newFilePath)
    console.log('renameImage success:', oldFilename, '->', path.basename(newFilePath))
    revalidatePath('/gallery')
    return `${env.NEXT_PUBLIC_DOMAIN}/uploads/${path.basename(newFilePath)}`
  } catch (error) {
    console.error('Error in renameImage:', error)
    throw new Error(error instanceof Error ? error.message : String(error))
  }
}

export async function deleteImage(imagePath: string, password: string) {
  if (password !== DELETE_PASSWORD) {
    throw new Error('Password salah!')
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const filename = imagePath.split('/').pop()
  if (!filename) throw new Error('Invalid image path')

  const filepath = path.join(uploadDir, filename)

  try {
    const { unlink } = await import('fs/promises')
    await unlink(filepath)
    console.log('deleteImage success:', filename)
    revalidatePath('/gallery')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteImage:', error)
    throw new Error(error instanceof Error ? error.message : String(error))
  }
}

