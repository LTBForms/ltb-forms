import dynamic from 'next/dynamic';

const FormN5 = dynamic(() => import('@/components/FormN5'), { ssr: false });

export default function N5Page() {
  return <FormN5 />
}
