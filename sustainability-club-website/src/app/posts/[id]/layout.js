import { getPostById } from '@/lib/posts';

const toDescription = (post) => {
  if (!post) return 'Read sustainability research shared by our club members.';
  const raw = post.introText || '';
  return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
};

export async function generateMetadata({ params }) {
  const { id } = params;
  const post = await getPostById(id);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested research post could not be found.',
      robots: {
        index: false,
        follow: true
      }
    };
  }

  const description = toDescription(post);
  const url = `/posts/${post.id}`;

  return {
    title: post.title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      publishedTime: post.date,
      authors: [post.author]
    },
    twitter: {
      title: post.title,
      description
    }
  };
}

export default function PostDetailsLayout({ children }) {
  return children;
}


