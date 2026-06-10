import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { supplierApi, type ProductSupplierWithInfo } from '../lib/supplierApi'
import type { Product, Shop, Supplier } from '@statistic/shared'

export function useProducts() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [shops, setShops] = useState<Shop[]>([])

  // URL-derived filter state
  const selectedShop = searchParams.get('shop') || ''
  const setSelectedShop = (v: string) =>
    setSearchParams((p) => {
      p.delete('page')
      if (v) p.set('shop', v)
      else p.delete('shop')
      return p
    })

  const page = parseInt(searchParams.get('page') || '1')
  const setPage = (p: number) =>
    setSearchParams((prev) => {
      prev.set('page', String(p))
      return prev
    })

  const visitDate = searchParams.get('date') || ''
  const setVisitDate = (v: string) =>
    setSearchParams((prev) => {
      prev.delete('page')
      if (v) prev.set('date', v)
      else prev.delete('date')
      return prev
    })

  const search = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(search)
  const doSearch = () =>
    setSearchParams((prev) => {
      prev.delete('page')
      if (searchInput) prev.set('search', searchInput)
      else prev.delete('search')
      return prev
    })

  const sortBy = searchParams.get('sort_by') || 'created_at'
  const sortOrder = searchParams.get('sort_order') || 'desc'

  // UI state
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [showTxForm, setShowTxForm] = useState(false)
  const [txProduct, setTxProduct] = useState<Product | null>(null)
  const [txForm, setTxForm] = useState({
    price: '',
    quantity: '1',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })
  const [form, setForm] = useState({
    shop_id: '',
    name: '',
    image_url: '',
    sku: '',
    price: '',
  })
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const pageSize = 30
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [showProductTx, setShowProductTx] = useState(false)
  const [productTxProduct, setProductTxProduct] = useState<Product | null>(null)
  const [productTxList, setProductTxList] = useState<any[]>([])
  const [productTxLoading, setProductTxLoading] = useState(false)
  const [showProductSuppliers, setShowProductSuppliers] = useState(false)
  const [psProduct, setPsProduct] = useState<Product | null>(null)
  const [psList, setPsList] = useState<ProductSupplierWithInfo[]>([])
  const [psLoading, setPsLoading] = useState(false)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [addSupplierProduct, setAddSupplierProduct] = useState<Product | null>(null)
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([])
  const [addSupplierForm, setAddSupplierForm] = useState({ supplier_id: '', price: '', note: '' })

  // Data loading
  const load = useCallback(() => {
    setLoading(true)
    api
      .getProducts(
        selectedShop || undefined,
        page,
        pageSize,
        visitDate || undefined,
        search || undefined,
        sortBy,
        sortOrder,
      )
      .then((res) => {
        setProducts(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }, [selectedShop, page, visitDate, search, sortBy, sortOrder])

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const pageIds = products.map((p) => p.id)
      const allSelected = pageIds.every((id) => next.has(id))
      for (const id of pageIds) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  // Refresh selected products
  const handleRefresh = async () => {
    if (selectedIds.size === 0) return
    setRefreshing(true)
    try {
      const res = await api.refreshProducts([...selectedIds])
      alert(`刷新成功，共刷新 ${res.count} 个商品`)
      setSelectedIds(new Set())
      load()
    } catch (err: any) {
      alert(err.message || '刷新失败')
    } finally {
      setRefreshing(false)
    }
  }

  // Sorting
  const toggleSort = (field: string) => {
    let newSortBy = field
    let newSortOrder = 'desc'
    if (sortBy === field) {
      if (sortOrder === 'desc') {
        newSortOrder = 'asc'
      } else {
        newSortBy = 'created_at'
        newSortOrder = 'desc'
      }
    }
    setSearchParams((prev) => {
      prev.delete('page')
      if (newSortBy !== 'created_at') {
        prev.set('sort_by', newSortBy)
        prev.set('sort_order', newSortOrder)
      } else {
        prev.delete('sort_by')
        prev.delete('sort_order')
      }
      return prev
    })
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return ' ⇅'
    return sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  // Product transactions
  const loadProductTransactions = async (productId: string) => {
    setProductTxLoading(true)
    try {
      const res = await api.getTransactions({ product_id: productId, limit: 50 })
      setProductTxList(res.items || [])
    } catch (err: any) {
      console.error('加载成交记录失败:', err)
      setProductTxList([])
    } finally {
      setProductTxLoading(false)
    }
  }

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await api.updateProduct(editing.id, {
          name: form.name,
          image_url: editing.image_url,
          description: editing.description,
          sku: form.sku,
          price: form.price,
        })
      } else {
        await api.createProduct(form)
      }
      setShowForm(false)
      setEditing(null)
      setShowFullDesc(false)
      setForm({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Edit / Delete
  const handleEdit = (product: Product) => {
    setEditing(product)
    setShowFullDesc(false)
    setForm({
      shop_id: product.shop_id,
      name: product.name,
      image_url: product.image_url,
      sku: product.sku,
      price: product.price,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此商品？关联的统计数据也会被删除。')) return
    try {
      await api.deleteProduct(id)
      load()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditing(null)
    setShowFullDesc(false)
    setForm({ shop_id: '', name: '', image_url: '', sku: '', price: '' })
    setError('')
  }

  // Open transaction form for a product
  const openTxForm = (product: Product) => {
    setTxProduct(product)
    setTxForm({
      price: product.price || '',
      quantity: '1',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    })
    setShowTxForm(true)
  }

  // Submit transaction form
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txProduct) return
    try {
      await api.createTransaction({
        product_id: txProduct.id,
        shop_id: txProduct.shop_id,
        price: txForm.price,
        quantity: parseInt(txForm.quantity) || 1,
        date: txForm.date,
        note: txForm.note,
      })
      setShowTxForm(false)
      setTxProduct(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Open product transaction list
  const openProductTx = (product: Product) => {
    setProductTxProduct(product)
    loadProductTransactions(product.id)
    setShowProductTx(true)
  }

  // Navigate to full transaction list
  const goToFullTransactions = () => {
    if (productTxProduct) {
      navigate(`/transactions?product_id=${productTxProduct.id}`)
    }
  }

  // Product suppliers
  const openProductSuppliers = useCallback(async (product: Product) => {
    setPsProduct(product)
    setPsLoading(true)
    setShowProductSuppliers(true)
    try {
      const list = await supplierApi.getAllProducts({ product_id: product.id })
      setPsList(list)
    } catch { setPsList([]) }
    finally { setPsLoading(false) }
  }, [])

  const unlinkSupplier = async (linkId: string) => {
    await supplierApi.unlinkProduct(linkId)
    if (psProduct) openProductSuppliers(psProduct)
  }

  // Add supplier
  const openAddSupplier = useCallback(async (product: Product) => {
    setAddSupplierProduct(product)
    setAddSupplierForm({ supplier_id: '', price: product.price || '', note: '' })
    setShowAddSupplier(true)
    if (allSuppliers.length === 0) {
      try { setAllSuppliers(await supplierApi.getSuppliers()) } catch { /* ignore */ }
    }
  }, [allSuppliers.length])

  const handleAddSupplier = async () => {
    if (!addSupplierProduct || !addSupplierForm.supplier_id) return
    try {
      await supplierApi.linkProduct({
        product_id: addSupplierProduct.id,
        supplier_id: addSupplierForm.supplier_id,
        price: addSupplierForm.price,
        note: addSupplierForm.note,
      })
      setShowAddSupplier(false)
      setAddSupplierProduct(null)
    } catch (err: any) {
      alert(err.message || '添加失败')
    }
  }

  // Effects
  useEffect(() => {
    api.getShops().then(setShops)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  // Derived
  const totalPages = Math.ceil(total / pageSize)

  return {
    // Navigation
    navigate,
    // Data
    products,
    shops,
    total,
    totalPages,
    pageSize,
    loading,
    // URL filter state
    selectedShop,
    setSelectedShop,
    page,
    setPage,
    visitDate,
    setVisitDate,
    search,
    searchInput,
    setSearchInput,
    doSearch,
    sortBy,
    sortOrder,
    toggleSort,
    getSortIcon,
    // Selection
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    handleRefresh,
    refreshing,
    // Product form
    showForm,
    setShowForm,
    editing,
    form,
    setForm,
    error,
    showFullDesc,
    setShowFullDesc,
    handleSubmit,
    handleEdit,
    cancelForm,
    // Transaction form
    showTxForm,
    setShowTxForm,
    txProduct,
    txForm,
    setTxForm,
    openTxForm,
    handleTxSubmit,
    // Product transaction list
    showProductTx,
    setShowProductTx,
    productTxProduct,
    productTxList,
    productTxLoading,
    openProductTx,
    goToFullTransactions,
    // Delete
    handleDelete,
    // Drawer
    drawerId,
    setDrawerId,
    // Suppliers
    showProductSuppliers,
    setShowProductSuppliers,
    psProduct,
    psList,
    psLoading,
    openProductSuppliers,
    unlinkSupplier,
    showAddSupplier,
    setShowAddSupplier,
    addSupplierProduct,
    allSuppliers,
    addSupplierForm,
    setAddSupplierForm,
    openAddSupplier,
    handleAddSupplier,
    // Reload
    load,
  }
}
