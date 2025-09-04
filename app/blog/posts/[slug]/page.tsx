import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';

// Check if blog post file exists and read it
async function getBlogPost(slug: string) {
  const filePath = path.join(process.cwd(), 'blog', 'posts', `${slug}.md`);

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');

    // Process markdown to HTML
    const processedContent = await remark().use(html).process(fileContents);

    const contentHtml = processedContent.toString();

    // Extract title from markdown (assuming first line is a # heading)
    const title = fileContents.split('\n')[0].replace('# ', '');

    return {
      slug,
      title,
      contentHtml
    };
  } catch (error) {
    return null;
  }
}

// Define page props
interface PageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="blog-post-container max-w-4xl mx-auto px-4 py-8 pt-16">
      <article>
        <h1 className="text-3xl font-bold mb-6">{post.title}</h1>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </div>
  );
}
