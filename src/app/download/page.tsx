import dynamic from 'next/dynamic';

const DownloadPage = dynamic(() => import('@/components/DownloadPage'), { ssr: false });

export default function Page() {
  return <DownloadPage />;
}