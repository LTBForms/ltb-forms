import dynamic from 'next/dynamic';

const FormN4 = dynamic(() => import('@/components/FormN4'), { ssr: false });

export default function NFourPage() {
  return <FormN4 />
}
