-- 拿货价：独立于供应商，随成交记录保存（可为空）
ALTER TABLE transactions ADD COLUMN purchase_price TEXT DEFAULT '';
