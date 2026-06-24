'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCopyToClipboard } from 'usehooks-ts'
import { Copy, Check, Pencil } from 'lucide-react'
import { env } from '../env'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { renameImage } from '../actions/upload-image'

interface ImageGalleryProps {
  images: string[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [_, copy] = useCopyToClipboard()
  const [imageList, setImageList] = useState(images)
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; filename: string; index: number }>({
    open: false,
    filename: '',
    index: -1,
  })
  const [renameError, setRenameError] = useState('')
  const [renaming, setRenaming] = useState(false)

  const handleCopy = useCallback((imagePath: string, index: number) => {
    const fullUrl = `${env.NEXT_PUBLIC_DOMAIN}/uploads/${imagePath}`
    const htmlSnippet = `<img src="${fullUrl}" alt="Gallery image" />`
    copy(htmlSnippet)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }, [copy])

  const openRename = useCallback((filename: string, index: number) => {
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '')
    const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : ''
    setRenameDialog({ open: true, filename: nameWithoutExt, index })
    setRenameError('')
  }, [])

  const handleRename = useCallback(async () => {
    const oldFilename = imageList[renameDialog.index]
    let newFilename = renameDialog.filename.trim()
    if (!newFilename) {
      setRenameError('Nama file tidak boleh kosong')
      return
    }

    // Preserve original extension
    const ext = oldFilename.includes('.') ? oldFilename.substring(oldFilename.lastIndexOf('.')) : ''
    if (!newFilename.includes('.')) {
      newFilename += ext
    }

    setRenaming(true)
    try {
      await renameImage(oldFilename, newFilename)
      const updatedList = [...imageList]
      updatedList[renameDialog.index] = newFilename
      setImageList(updatedList)
      setRenameDialog({ open: false, filename: '', index: -1 })
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Gagal rename file')
    } finally {
      setRenaming(false)
    }
  }, [imageList, renameDialog])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imageList.map((image, index) => (
          <Card key={`${image}-${index}`}>
            <CardContent className="p-4">
              <div className="relative w-full h-40 mb-2">
                <Image
                  src={`/uploads/${image}`}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="flex justify-between items-center gap-1">
                <span className="text-sm truncate flex-1">{image}</span>
                <Button
                  onClick={() => openRename(image, index)}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleCopy(image, index)}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Image</DialogTitle>
            <DialogDescription>
              Masukkan nama baru untuk file ini. Ekstensi file akan tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameDialog.filename}
              onChange={(e) => setRenameDialog(prev => ({ ...prev, filename: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
              placeholder="Nama file baru"
              autoFocus
            />
            {renameError && (
              <p className="text-sm text-red-500 mt-2">{renameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialog({ open: false, filename: '', index: -1 })}
            >
              Batal
            </Button>
            <Button onClick={handleRename} disabled={renaming}>
              {renaming ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
