import {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import { revalidateTag } from 'next/cache'

export const revalidateCategories: CollectionAfterChangeHook = () => {
  revalidateTag('blog', 'max')
}

export const deleteCategories: CollectionAfterDeleteHook = () => {
  revalidateTag('blog', 'max')
}
