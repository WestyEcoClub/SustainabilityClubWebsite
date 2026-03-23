import { getAllPosts } from '@/lib/posts';
import { getSiteUrl } from '@/lib/site';

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes = [
    '',
    '/about',
    '/calculator',
    '/posts'
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7
  }));

  let postRoutes = [];
  try {
    const posts = await getAllPosts();
    postRoutes = posts.map((post) => ({
      url: `${siteUrl}/posts/${post.id}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.6
    }));
  } catch (error) {
    postRoutes = [];
  }

  return [...staticRoutes, ...postRoutes];
}

