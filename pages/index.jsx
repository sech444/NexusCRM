import dynamic from 'next/dynamic'

// Dynamic import so SSR doesn’t block or mismatch with client-only features you might have (stateful login/dashboard, browser APIs)
const NexusCRM = dynamic(() => import('../Component/NexusCRM'), { ssr: false })

export default function HomePage() {
  return <NexusCRM />
}