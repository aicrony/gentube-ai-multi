import { NextRequest, NextResponse } from 'next/server';
import blogPostsData from '@/data/blogPosts.json';

export async function GET(request: NextRequest) {
  return NextResponse.json(blogPostsData.posts);
}
