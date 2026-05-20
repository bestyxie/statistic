/**
 * 日期工具函数
 * 所有脚本统一使用北京时间（Asia/Shanghai）来计算日期
 */

/** 获取北京时间（Asia/Shanghai）的昨日日期，格式 YYYY-MM-DD */
export function getBeijingYesterday(): string {
  const yesterday = new Date(Date.now() - 86400000)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(yesterday)
}

/** 获取北京时间（Asia/Shanghai）的今日日期，格式 YYYY-MM-DD */
export function getBeijingToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
