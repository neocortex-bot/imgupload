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
import { renameImage, deleteImage } from '../actions/upload-image'

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

  // Delete state
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

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
    setDeletePassword('')
    setDeleteError('')
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

  const handleDelete = useCallback(async () => {
    if (!deletePassword) {
      setDeleteError('Masukkan password!')
      return
    }

    const filename = imageList[renameDialog.index]

    setDeleting(true)
    try {
      await deleteImage(filename, deletePassword)
      // Remove from list
      const updatedList = imageList.filter((_, i) => i !== renameDialog.index)
      setImageList(updatedList)
      setRenameDialog({ open: false, filename: '', index: -1 })
      setDeletePassword('')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal hapus gambar')
    } finally {
      setDeleting(false)
    }
  }, [imageList, renameDialog, deletePassword])

  const closeDialog = useCallback(() => {
    setRenameDialog({ open: false, filename: '', index: -1 })
    setDeletePassword('')
    setDeleteError('')
    setRenameError('')
  }, [])

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

      <Dialog open={renameDialog.open} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Image</DialogTitle>
            <DialogDescription>
              Masukkan nama baru untuk file ini. Ekstensi file akan tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              value={renameDialog.filename}
              onChange={(e) => setRenameDialog(prev => ({ ...prev, filename: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
              placeholder="Nama file baru"
              autoFocus
            />
            {renameError && (
              <p className="text-sm text-red-500">{renameError}</p>
            )}

            <hr className="border-t" />

            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete Image</p>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleDelete() }}
                placeholder="Masukkan password untuk hapus"
              />
              {deleteError && (
                <p className="text-sm text-red-500">{deleteError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeDialog}>
                Batal
              </Button>
              <Button onClick={handleRename} disabled={renaming}>
                {renaming ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
