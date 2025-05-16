'use client';

import ImageGallery from '@/functions/getGallery';

export default function Gallery() {
  return (
    <section>
      <div className="max-w-6xl px-4 mx-auto sm:py-12 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="mt-20 text-4xl font-extrabold sm:text-center sm:text-6xl">
            GenTube.ai Gallery
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-center sm:text-center sm:text-2xl">
            WIN 500 Credits every month with the most community hearts!
          </p>
        </div>
        <div className="mt-4 sm:mt-1">
          <ImageGallery />
        </div>
      </div>
    </section>
  );
}
