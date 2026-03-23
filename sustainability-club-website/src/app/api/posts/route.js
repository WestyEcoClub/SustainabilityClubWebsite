import { getAllPosts } from '@/lib/posts';

export async function GET() {
  try {
    const filteredPosts = await getAllPosts();

    return new Response(JSON.stringify(filteredPosts), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error reading posts directory:", error);
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
