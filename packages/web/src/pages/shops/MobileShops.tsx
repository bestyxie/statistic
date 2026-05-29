import { useShops } from '../../hooks/useShops'
import MobilePageHeader from '../../components/mobile/MobilePageHeader'
import MobileCard, { MobileCardActions } from '../../components/mobile/MobileCard'

export default function MobileShops() {
  const {
    shops, loading, showForm, form, error, editing,
    setForm, setShowForm, handleSubmit, handleEdit, handleDelete, cancelForm,
  } = useShops()

  return (
    <div className="space-y-4">
      <MobilePageHeader
        title="店铺管理"
        actions={
          !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
            >
              添加
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <MobileCard>
          <h3 className="text-sm font-semibold mb-3">{editing ? '编辑店铺' : '添加店铺'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">店铺名称</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：XX旗舰店"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">所属平台</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="淘宝">淘宝</option>
                <option value="天猫">天猫</option>
                <option value="拼多多">拼多多</option>
                <option value="京东">京东</option>
                <option value="1688">1688</option>
                <option value="抖音">抖音</option>
                <option value="其他">其他</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">
                {editing ? '保存' : '添加'}
              </button>
              <button type="button" onClick={cancelForm} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm">
                取消
              </button>
            </div>
          </form>
        </MobileCard>
      )}

      {loading ? (
        <p className="text-center py-12 text-gray-400 text-sm">加载中...</p>
      ) : shops.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">暂无店铺</p>
      ) : (
        <div className="space-y-2">
          {shops.map((shop) => (
            <MobileCard key={shop.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{shop.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {shop.platform || '未设置平台'} · {shop.created_at?.slice(0, 10)}
                  </p>
                </div>
              </div>
              <MobileCardActions>
                <button
                  onClick={() => handleEdit(shop)}
                  className="text-blue-600 text-sm"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(shop.id)}
                  className="text-red-500 text-sm"
                >
                  删除
                </button>
              </MobileCardActions>
            </MobileCard>
          ))}
        </div>
      )}
    </div>
  )
}
