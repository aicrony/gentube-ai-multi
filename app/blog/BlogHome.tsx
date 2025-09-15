import Link from 'next/link';
import Image from 'next/image';
import blogPostsData from '@/data/blogPosts.json';

interface BlogPost {
  slug: string;
  title: string;
  intro: string;
  image: string;
}

// This function simulates getting blog posts from our JSON file
async function getBlogPosts() {
  // In a real application, you might fetch this data from an API
  // or use a content management system
  return blogPostsData.posts;
}

export default async function BlogHome() {
  const posts = await getBlogPosts();

  return (
    <div className="sm:flex sm:flex-col sm:align-center px-4 py-8 pt-16">
      <h1 className="text-4xl font-extrabold sm:text-center sm:text-6xl pb-4 pt-8">
        Gentube.ai Blog
      </h1>
      <p className="text-center pb-4">AI Tutorials, News, and Discussion</p>
      {posts.length === 0 ? (
        <p className="text-center py-10">No blog posts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: BlogPost) => (
            <div
              key={post.slug}
              className="blog-card border rounded-lg overflow-hidden shadow-md"
            >
              <Image
                src={post.image}
                alt={post.title}
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-4">{post.intro}</p>
                <Link href={`/blog/posts/${post.slug}`}>Read More</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
