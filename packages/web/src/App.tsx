import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Shops from './pages/Shops'
import Products from './pages/Products'
import DataEntry from './pages/DataEntry'
import Stats from './pages/Stats'
import ProductDetail from './pages/ProductDetail'
import Visitors from './pages/Visitors'
import Transactions from './pages/Transactions'
import { setNavigateToLogin } from './lib/api'

function AppContent() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [checking, setChecking] = useState(true)

  // 设置全局导航回调
  useEffect(() => {
    setNavigateToLogin(() => {
      setIsLoggedIn(false)
      navigate('/login', { replace: true })
    })
  }, [navigate])

  // 监听 localStorage token 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        setIsLoggedIn(false)
      }
    }

    // 监听同页面的 localStorage 变化
    const checkToken = () => {
      const token = localStorage.getItem('token')
      if (!token && isLoggedIn) {
        setIsLoggedIn(false)
        navigate('/login', { replace: true })
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // 使用轮询检查 token（同页面内修改 localStorage 不会触发 storage 事件）
    const tokenCheckInterval = setInterval(checkToken, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(tokenCheckInterval)
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    setChecking(false)
  }, [])

  if (checking) return <div className="flex items-center justify-center h-screen">加载中...</div>

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout onLogout={() => { localStorage.removeItem('token'); setIsLoggedIn(false) }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/data-entry" element={<DataEntry />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return <AppContent />
}

export default App
