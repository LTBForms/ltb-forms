import dynamic from 'next/dynamic';

const FormN8 = dynamic(() => import('@/components/FormN8'), { ssr: false });

export default function N8Page() {
  return <FormN8 />
}
