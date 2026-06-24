'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCopyToClipboard } from 'usehooks-ts'
import { uploadImage, renameImage } from '../actions/upload-image'
import { Copy, Check } from 'lucide-react'
import Image from 'next/image'

export function ImageUploader() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [_, copy] = useCopyToClipboard()
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [customFilename, setCustomFilename] = useState('')
  const [newFilename, setNewFilename] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      await handleImageUpload(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {'image/*': []},
    maxFiles: 1
  })

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', customFilename || file.name)
      const imagePath = await uploadImage(formData)
      setUploadedImage(imagePath)
      setNewFilename(imagePath.split('/').pop() || '')
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            await handleImageUpload(file)
          }
          break
        }
      }
    }
  }

  const handleCopy = () => {
    if (uploadedImage) {
      const htmlSnippet = `<img src="${uploadedImage}" alt="Uploaded image" />`
      copy(htmlSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRename = async () => {
    if (uploadedImage && newFilename) {
      try {
        const updatedPath = await renameImage(uploadedImage, newFilename)
        setUploadedImage(updatedPath)
        setNewFilename(updatedPath.split('/').pop() || '')
      } catch (error) {
        console.error('Error renaming image:', error)
        setError('Failed to rename image. Please try again.')
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="mb-4">
          <Label htmlFor="custom-filename">Custom Filename (optional)</Label>
          <Input
            id="custom-filename"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder="Enter custom filename"
          />
        </div>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer"
          onPaste={handlePaste}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the image here ...</p>
          ) : (
            <p>Drag & drop an image here, click to select one, or paste from clipboard</p>
          )}
        </div>
        {isUploading && <p className="mt-4 text-blue-500">Uploading image...</p>}
        {uploadedImage && (
          <div className="mt-4 space-y-4">
            <div className="relative w-full h-48">
              <Image
                src={uploadedImage}
                alt="Uploaded image"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div>
              <Label htmlFor="image-url">Image URL:</Label>
              <div className="flex mt-1">
                <Input
                  id="image-url"
                  value={uploadedImage}
                  readOnly
                />
                <Button
                  onClick={handleCopy}
                  className="ml-2"
                  variant="outline"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">HTML snippet copied to clipboard when you click the button</p>
            </div>
            <div>
              <Label htmlFor="new-filename">Rename File:</Label>
              <div className="flex mt-1">
                <Input
                  id="new-filename"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="Enter new filename"
                />
                <Button
                  onClick={handleRename}
                  className="ml-2"
                  variant="outline"
                >
                  Rename
                </Button>
              </div>
            </div>
          </div>
        )}
        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}

