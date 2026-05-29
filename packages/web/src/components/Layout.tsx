import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Agentation } from 'agentation'

interface LayoutProps {
  onLogout: () => void
  children: React.ReactNode
}

const navItems = [
  { to: '/', label: '仪表盘' },
  { to: '/shops', label: '店铺管理' },
  { to: '/products', label: '商品管理' },
  { to: '/visitors', label: '访客列表' },
  { to: '/transactions', label: '成交明细' },
  { to: '/suppliers', label: '供应商' },
  { to: '/data-entry', label: '数据录入' },
  { to: '/stats', label: '数据查询' },
]

export default function Layout({ onLogout, children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-lg font-bold text-gray-800">电商统计</span>
              </div>
              <div className="hidden sm:flex sm:ml-8 sm:space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                退出
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white pb-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>

      <Agentation />
    </div>
  )
}
