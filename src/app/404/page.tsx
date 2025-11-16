'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Arrow from '@/src/assets/Arrow.svg';

export default function NotFoundPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <h1 className="text-6xl font-bold text-slate-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-2">Page Not Found</h2>
          <p className="text-slate-500 mb-6">
            The page you are looking for does not exist or you do not have permission to access it.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Image src={Arrow} alt="Back" width={16} height={16} className="mr-2 rotate-180" />
            Go Back Home
          </button>
        </div>
      </div>
    </div>
  );
}

