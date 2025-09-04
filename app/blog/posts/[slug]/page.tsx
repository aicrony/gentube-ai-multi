import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

// Hardcoded blog posts data (same as in BlogHome.tsx)
const blogPosts = [
  {
    slug: '09032025-gentube-blog',
    title: 'The Benefits of Using AI-Generated Images',
    intro:
      'AI-generated images are transforming the way individuals and businesses create visual content. Leveraging advanced machine learning models, these tools offer a range of advantages.',
    image: '/blog/images/gentube-download1.jpg'
  }
  // Add more blog posts here if needed
];

// Function to get blog post image by slug
function getBlogPostImage(slug: string): string | undefined {
  const post = blogPosts.find((post) => post.slug === slug);
  return post?.image;
}

// Check if blog post file exists and read it
async function getBlogPost(slug: string) {
  const filePath = path.join(process.cwd(), 'blog', 'posts', `${slug}.md`);

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');

    // Extract title from markdown (assuming first line is a # heading)
    const title = fileContents.split('\n')[0].replace('# ', '');

    // Remove the title line from the markdown content
    const contentWithoutTitle = fileContents
      .split('\n')
      .slice(1)
      .join('\n')
      .trim();

    // Process markdown to HTML (without the title)
    const processedContent = await remark()
      .use(html)
      .process(contentWithoutTitle);
    const contentHtml = processedContent.toString();

    // Get image path for this post
    const image = getBlogPostImage(slug);

    return {
      slug,
      title,
      contentHtml,
      image
    };
  } catch (error) {
    return null;
  }
}

// Define page props
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// This function correctly handles params for Next.js
export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const post = await getBlogPost(params.slug);

  return {
    title: post?.title || 'Blog Post'
  };
}

export default async function BlogPostPage(props: PageProps) {
  const params = await props.params;
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="blog-post-container max-w-4xl mx-auto px-4 py-8 pt-16">
      <article>
        {post.image && (
          <div className="mb-6">
            <Image
              src={post.image}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-64 object-cover rounded-lg"
              priority
            />
          </div>
        )}
        <h1 className="text-3xl font-bold mb-6">{post.title}</h1>
        <div className="prose max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-3xl font-bold !text-gray-900 dark:!text-gray-100"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-semibold !text-gray-900 dark:!text-gray-100"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-4 leading-relaxed" {...props} />
              )
            }}
            rehypePlugins={[rehypeRaw]}
          >
            {post.contentHtml}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
