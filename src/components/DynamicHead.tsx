import dynamic from 'next/dynamic';

export const DynamicHead = dynamic(
  () => import('./TableHead'), { ssr: false }
)