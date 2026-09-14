import dynamic from 'next/dynamic';

const FormN12 = dynamic(() => import('@/components/FormN12'), { ssr: false });


export default function N12Page() {
  return <FormN12 />
}