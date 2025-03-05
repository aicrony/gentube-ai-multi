import ImageGallery from '@/functions/getGallery';

export default async function Gallery() {
  return (
    <section>
      <div className="max-w-6xl px-4 mx-auto sm:py-12 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="mt-8 text-4xl font-extrabold sm:text-center sm:text-6xl">
            GenTube.ai Gallery
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-center sm:text-center sm:text-2xl">
            See what the GenTube.ai community has created.
          </p>
        </div>
        <div className="mt-12 sm:mt-1">
          <ImageGallery />
        </div>
      </div>
    </section>
  );
}
