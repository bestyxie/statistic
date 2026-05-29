import type { ReactNode } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

interface Props {
  desktop: ReactNode
  mobile: ReactNode
}

export default function ResponsivePage({ desktop, mobile }: Props) {
  const isMobile = useIsMobile()
  return isMobile ? <>{mobile}</> : <>{desktop}</>
}
