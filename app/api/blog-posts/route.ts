import { NextRequest, NextResponse } from 'next/server';

// Hardcoded blog posts data - matching what's in BlogHome.tsx
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

export async function GET(request: NextRequest) {
  return NextResponse.json(blogPosts);
}