#!/usr/bin/env npx tsx
/**
 * 定时任务调度器
 * 每天凌晨1点执行 import-by-visitors 脚本
 *
 * 用法: npx tsx src/scripts/schedule-import.ts
 *
 * 环境变量:
 *   ADMIN_USER - 管理员用户名 (默认: admin)
 *   ADMIN_PASS - 管理员密码 (默认: admin123)
 *   SHOP_ID - 店铺ID
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const SHOP_ID = process.env.SHOP_ID || 'eee675ce-2a83-4413-96b2-155c2c0385a4'

function getNextRunTime(): Date {
  const now = new Date()
  const next = new Date()

  // 设置为凌晨1点
  next.setHours(1, 0, 0, 0)

  // 如果今天的1点已经过了，设置为明天1点
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天${hours % 24}小时`
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

async function runImportScript(): Promise<void> {
  const scriptPath = new URL('./import-by-visitors.ts', import.meta.url).pathname

  console.log(`执行脚本: ${scriptPath}`)

  const { stdout, stderr } = await execAsync(`npx tsx "${scriptPath}"`, {
    env: {
      ...process.env,
      SHOP_ID,
    },
  })

  if (stdout) {
    console.log(stdout)
  }

  if (stderr) {
    console.error(stderr)
  }
}

async function scheduleDailyImport() {
  console.log('\n=== 定时任务调度器启动 ===')
  console.log(`店铺ID: ${SHOP_ID}`)
  console.log(`执行时间: 每天凌晨 1:00`)
  console.log(`按 Ctrl+C 退出\n`)

  while (true) {
    const nextRun = getNextRunTime()
    const now = new Date()
    const timeUntilNext = nextRun.getTime() - now.getTime()

    console.log(`下次执行时间: ${nextRun.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
    console.log(`距离执行: ${formatTimeRemaining(timeUntilNext)}`)
    console.log('---')

    // 计算等待时间
    await new Promise(resolve => setTimeout(resolve, timeUntilNext))

    // 执行导入任务
    try {
      console.log('\n开始执行导入任务...\n')
      await runImportScript()
      console.log('\n导入任务完成!')
    } catch (error: any) {
      console.error('\n导入任务失败:', error.message)
    }

    // 等待一小段时间避免在同一天内重复执行
    await new Promise(resolve => setTimeout(resolve, 60000))
  }
}

// 如果直接运行此脚本，启动调度器
if (import.meta.url === `file://${process.argv[1]}`) {
  scheduleDailyImport().catch((error) => {
    console.error('调度器异常:', error)
    process.exit(1)
  })
}

export { scheduleDailyImport }
