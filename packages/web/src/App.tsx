import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import ResponsivePage from './components/ResponsivePage'

// Desktop pages
import DesktopDashboard from './pages/dashboard/DesktopDashboard'
import DesktopShops from './pages/shops/DesktopShops'
import DesktopVisitors from './pages/visitors/DesktopVisitors'
import DesktopTransactions from './pages/transactions/DesktopTransactions'
import DesktopRanking from './pages/rankings/DesktopRanking'
import DesktopStats from './pages/stats/DesktopStats'
import DesktopDataEntry from './pages/data-entry/DesktopDataEntry'
import DesktopSuppliers from './pages/suppliers/DesktopSuppliers'
// Products desktop still uses original component during migration
import DesktopProducts from './pages/Products'

// Mobile pages
import MobileDashboard from './pages/dashboard/MobileDashboard'
import MobileShops from './pages/shops/MobileShops'
import MobileVisitors from './pages/visitors/MobileVisitors'
import MobileTransactions from './pages/transactions/MobileTransactions'
import MobileRanking from './pages/rankings/MobileRanking'
import MobileStats from './pages/stats/MobileStats'
import MobileDataEntry from './pages/data-entry/MobileDataEntry'
import MobileSuppliers from './pages/suppliers/MobileSuppliers'
import MobileProducts from './pages/products/MobileProducts'

import { setNavigateToLogin } from './lib/api'

function AppContent() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setNavigateToLogin(() => {
      setIsLoggedIn(false)
      navigate('/login', { replace: true })
    })
  }, [navigate])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        setIsLoggedIn(false)
      }
    }

    const checkToken = () => {
      const token = localStorage.getItem('token')
      if (!token && isLoggedIn) {
        setIsLoggedIn(false)
        navigate('/login', { replace: true })
      }
    }

    window.addEventListener('storage', handleStorageChange)
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
        <Route path="/" element={<ResponsivePage desktop={<DesktopDashboard />} mobile={<MobileDashboard />} />} />
        <Route path="/shops" element={<ResponsivePage desktop={<DesktopShops />} mobile={<MobileShops />} />} />
        <Route path="/products" element={<ResponsivePage desktop={<DesktopProducts />} mobile={<MobileProducts />} />} />
        <Route path="/product-ranking" element={<ResponsivePage desktop={<DesktopRanking />} mobile={<MobileRanking />} />} />
        <Route path="/visitors" element={<ResponsivePage desktop={<DesktopVisitors />} mobile={<MobileVisitors />} />} />
        <Route path="/transactions" element={<ResponsivePage desktop={<DesktopTransactions />} mobile={<MobileTransactions />} />} />
        <Route path="/suppliers" element={<ResponsivePage desktop={<DesktopSuppliers />} mobile={<MobileSuppliers />} />} />
        <Route path="/data-entry" element={<ResponsivePage desktop={<DesktopDataEntry />} mobile={<MobileDataEntry />} />} />
        <Route path="/stats" element={<ResponsivePage desktop={<DesktopStats />} mobile={<MobileStats />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return <AppContent />
}

export default App
