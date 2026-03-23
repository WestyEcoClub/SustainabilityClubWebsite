import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "About",
  description: "Learn about the mission, methods, and creators behind our carbon calculator.",
  alternates: {
    canonical: '/about'
  },
  openGraph: {
    title: 'About Sustainability Club',
    description: 'Learn about the mission, methods, and creators behind our carbon calculator.',
    url: '/about'
  },
  twitter: {
    title: 'About Sustainability Club',
    description: 'Learn about the mission, methods, and creators behind our carbon calculator.'
  }
};

async function getAboutMarkdown() {
  const filePath = path.join(process.cwd(), "public", "about-page", "About Page.md");
  return fs.readFile(filePath, "utf8");
}

function splitMarkdownIntoSections(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");

  let heroTitle = "About";
  let heroIntro = "";
  const sections = [];

  let currentSection = null;
  let inHero = true;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("# ")) {
      heroTitle = line.replace(/^#\s+/, "").trim();
      continue;
    }

    if (line.startsWith("## ")) {
      inHero = false;
      if (currentSection) {
        currentSection.content = currentSection.content.trim();
        sections.push(currentSection);
      }
      currentSection = {
        heading: line.replace(/^##\s+/, "").trim(),
        content: "",
      };
      continue;
    }

    if (inHero) {
      heroIntro += `${line}\n`;
      continue;
    }

    if (currentSection) {
      currentSection.content += `${line}\n`;
    }
  }

  if (currentSection) {
    currentSection.content = currentSection.content.trim();
    sections.push(currentSection);
  }

  return {
    heroTitle,
    heroIntro: heroIntro.trim(),
    sections,
  };
}

const markdownComponents = {
  h1: ({ children }) => <h1 className="text-4xl md:text-5xl font-black text-primary-skyblue mb-6">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-bold text-primary-green mt-8 mb-4">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">{children}</h3>,
  p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-outside pl-6 text-gray-700 mb-4 space-y-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-6 text-gray-700 mb-4 space-y-2">{children}</ol>,
  li: ({ children }) => <li className="marker:text-primary-green [&>p]:mb-0">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary-green bg-green-50/80 rounded-r-xl px-4 py-3 my-4 text-gray-700 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
};

export default async function AboutPage() {
  const markdown = await getAboutMarkdown();
  const { heroTitle, heroIntro, sections } = splitMarkdownIntoSections(markdown);

  return (
    <div className="max-w-5xl mx-auto py-16 px-4 space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary-green to-primary-skyblue text-white p-8 md:p-12 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <Sparkles className="w-6 h-6" />
          <p className="text-sm uppercase tracking-[0.2em] font-semibold text-white/90">About This Project</p>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">{heroTitle.replace(/\*\*/g, "")}</h1>
        {heroIntro ? (
          <div className="text-blue-50 text-lg max-w-3xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {heroIntro}
            </ReactMarkdown>
          </div>
        ) : null}
      </section>

      {sections.map((section, index) => (
        <section
          key={section.heading}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-primary-green font-black">
              {index + 1}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-primary-skyblue">
              {section.heading.replace(/\*\*/g, "")}
            </h2>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {section.content}
          </ReactMarkdown>
        </section>
      ))}
    </div>
  );
}
