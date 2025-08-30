'use client';

import GalleryFinal from '@/functions/GalleryFinal';
import { useSearchParams } from 'next/navigation';

export default function Gallery() {
  // The GalleryFinal component will handle the ID parameter internally
  return (
    <section>
      <div className="max-w-7xl px-4 mx-auto sm:py-12 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="mt-20 text-4xl font-extrabold sm:text-center sm:text-6xl">
            GenTube.ai Contest Gallery
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-center sm:text-center sm:text-2xl">
            Vote for your favorite creations! Top asset wins 500 Credits.
          </p>
        </div>
        <div className="mt-8 sm:mt-6">
          <GalleryFinal forceEndedForTesting={false} />
        </div>
      </div>
    </section>
  );
}
