import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Shop } from '@statistic/shared'

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Shop | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', platform: '' })
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.getShops().then(setShops).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api.updateShop(editing.id, form.name, form.platform)
      } else {
        await api.createShop(form.name, form.platform)
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', platform: '' })
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (shop: Shop) => {
    setEditing(shop)
    setForm({ name: shop.name, platform: shop.platform })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此店铺？关联的商品和统计数据也会被删除。')) return
    try {
      await api.deleteShop(id)
      load()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', platform: '' })
    setError('')
  }

  return {
    shops, loading, editing, showForm, form, error,
    setForm, setShowForm, handleSubmit, handleEdit, handleDelete, cancelForm,
  }
}
