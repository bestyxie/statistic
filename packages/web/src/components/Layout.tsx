import { NavLink, Outlet } from 'react-router-dom'
import { Agentation } from 'agentation'

interface LayoutProps {
  onLogout: () => void
  children: React.ReactNode
}

const navItems = [
  { to: '/', label: '仪表盘' },
  { to: '/shops', label: '店铺管理' },
  { to: '/products', label: '商品管理' },
  { to: '/data-entry', label: '数据录入' },
  { to: '/stats', label: '数据查询' },
]

export default function Layout({ onLogout, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-800">电商统计</span>
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
            <div className="flex items-center">
              <button
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <Agentation />
    </div>
  )
}
