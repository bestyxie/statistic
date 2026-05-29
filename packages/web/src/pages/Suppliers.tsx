import { useState } from 'react'
import SupplyListTab from '../components/suppliers/SupplyListTab'
import PurchaseRecordsTab from '../components/suppliers/PurchaseRecordsTab'

const tabs = [
  { key: 'supply', label: '供货列表' },
  { key: 'purchases', label: '拿货记录' },
] as const

type TabKey = typeof tabs[number]['key']

export default function Suppliers() {
  const [activeTab, setActiveTab] = useState<TabKey>('supply')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">供应商管理</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'supply' && <SupplyListTab />}
      {activeTab === 'purchases' && <PurchaseRecordsTab />}
    </div>
  )
}
