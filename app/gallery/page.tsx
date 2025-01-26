import ImageGallery from '@/functions/getGallery';

export default async function Gallery() {
  return (
    <section className="mb-32 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="sm:align-center sm:flex sm:flex-col pl-4 pr-4">
          <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            GenTube.ai Gallery
          </h1>
          <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
            See what the GenTube.ai community has created.
          </p>
        </div>
        <ImageGallery />
      </div>
    </section>
  );
}
