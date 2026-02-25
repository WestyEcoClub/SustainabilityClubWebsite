'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, User, Calendar, ExternalLink, Loader2 } from 'lucide-react';

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const MarkdownComponents = {
    h1: ({ children }) => <h1 className="text-3xl font-black text-primary-green mb-6 mt-8">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold text-primary-skyblue mb-4 mt-6">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold text-gray-800 mb-3 mt-4">{children}</h3>,
    p: ({ children }) => <p className="text-gray-600 mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-600">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-600">{children}</ol>,
    li: ({ children }) => <li className="pl-2">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary-green pl-6 py-2 italic my-6 bg-green-50/50 rounded-r-xl">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }) => (
      <img 
        src={src} 
        alt={alt} 
        className="rounded-2xl shadow-md my-8 max-w-full h-auto border-4 border-white"
      />
    ),
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary-skyblue font-bold underline hover:text-primary-green transition-colors"
      >
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 text-primary-skyblue px-2 py-0.5 rounded font-mono text-sm">
        {children}
      </code>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-8 rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50 text-gray-700 font-bold">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
    tr: ({ children }) => <tr className="hover:bg-gray-50/50 transition-colors">{children}</tr>,
    th: ({ children }) => <th className="px-6 py-4 border-b border-gray-100">{children}</th>,
    td: ({ children }) => <td className="px-6 py-4 text-gray-600">{children}</td>,
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div>
          <h1 className="text-5xl font-black text-primary-skyblue mb-2">Research & Insights</h1>
          <p className="text-gray-500 text-lg">Knowledge shared by our sustainability community.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 text-primary-skyblue animate-spin" />
          <p className="text-gray-400 font-bold">Loading publications...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">No publications found yet.</h3>
          <p className="text-gray-400">Add Markdown descriptions to <code>public/post-description/</code> and matching original files to <code>public/posts/</code>.</p>
        </div>
      ) : (
        <div className="grid gap-12">
          {posts.map(post => (
            <article key={post.id} className="group bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col md:flex-row gap-10 items-start">
              <div className={`p-6 rounded-2xl ${post.originalType === 'markdown' ? 'bg-green-50 text-primary-green' : 'bg-blue-50 text-primary-skyblue'}`}>
                <FileText className="w-10 h-10" />
              </div>
              
              <div className="flex-1 w-full">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${post.originalType === 'markdown' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {post.originalType}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                </div>

                <h3 className="text-3xl font-black text-gray-800 mb-6 group-hover:text-primary-skyblue transition-colors leading-tight">
                  {post.title}
                </h3>
                
                <div className="prose prose-lg prose-green max-w-none text-gray-600 leading-relaxed">
                  <div className="markdown-container bg-white/80 p-8 rounded-3xl border border-gray-100 shadow-xl mb-12">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      components={MarkdownComponents}
                    >
                      {post.introContent}
                    </ReactMarkdown>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <a 
                      href={post.originalType === 'markdown' ? `/posts/${post.id}` : post.originalUrl} 
                      target={post.originalType === 'markdown' ? '_self' : '_blank'} 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary-green text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-skyblue hover:scale-105 transition-all shadow-md"
                    >
                      <ExternalLink className="w-5 h-5" />
                      View Original {post.originalType === 'pdf' ? 'PDF' : 'Document'}
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
