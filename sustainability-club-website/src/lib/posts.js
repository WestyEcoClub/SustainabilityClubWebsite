import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';

const DESC_DIRECTORY = path.join(process.cwd(), 'public/post-description');
const POSTS_DIRECTORY = path.join(process.cwd(), 'public/posts');

const toPlainText = (markdown = '') => {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[>*_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildPost = async (descFileName) => {
  const baseName = descFileName.replace(/\.md$/, '');
  const descPath = path.join(DESC_DIRECTORY, descFileName);

  const postEntries = await fs.readdir(POSTS_DIRECTORY);
  const originalFileName = postEntries.find((fileName) => fileName.startsWith(`${baseName}.`));

  if (!originalFileName) return null;

  const introContent = await fs.readFile(descPath, 'utf8');
  const isPdf = originalFileName.endsWith('.pdf');
  const parts = baseName.split('-');

  const date = parts[0] && parts[1] && parts[2]
    ? `${parts[0]}-${parts[1]}-${parts[2]}`
    : new Date().toISOString().split('T')[0];
  const author = parts[3] || 'Sustainability Club';
  const title = parts.slice(4).join(' ') || baseName.replace(/-/g, ' ');

  return {
    id: baseName,
    title,
    author,
    date,
    introContent,
    introText: toPlainText(introContent),
    originalUrl: `/posts/${originalFileName}`,
    originalType: isPdf ? 'pdf' : 'markdown'
  };
};

export const getAllPosts = async () => {
  const descEntries = await fs.readdir(DESC_DIRECTORY, { withFileTypes: true });
  const descFiles = descEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name);

  const posts = await Promise.all(descFiles.map((fileName) => buildPost(fileName)));

  return posts
    .filter((post) => post !== null)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getPostById = async (id) => {
  const posts = await getAllPosts();
  return posts.find((post) => post.id === id) || null;
};

