// 趋势图上可点击的数据点，作为 <Line activeDot={...}> 使用。
// 为什么放在 activeDot 而不是 dot 上：recharts 的 activeDot 渲染在更高的 z-index 层
// （scatter=600 < cursorLine=1100 < activeDot=1200），普通 dot 会被悬停时出现的
// activeDot / cursorLine 遮挡而点不到，所以把点击交互挂在 activeDot 上才可靠。
// recharts 会通过 cloneElement 注入 cx/cy/payload 等属性（其余如 r/fill 由内部使用，
// 这里忽略，组件自行决定样式）。
interface Props {
  cx?: number
  cy?: number
  payload?: { date?: string }
  color: string
  labelId: string
  labelName: string
  onPointClick: (date: string | undefined, labelId: string, labelName: string) => void
}

export default function LabelTrendDot({ cx, cy, payload, color, labelId, labelName, onPointClick }: Props) {
  if (cx == null || cy == null) return null
  return (
    <g>
      {/* 透明加大命中区域，方便点击 */}
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill="transparent"
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
        onClick={() => onPointClick(payload?.date, labelId, labelName)}
      />
      {/* 可见圆点 */}
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} style={{ pointerEvents: 'none' }} />
    </g>
  )
}
