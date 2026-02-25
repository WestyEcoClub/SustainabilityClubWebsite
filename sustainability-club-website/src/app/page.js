import Link from 'next/link';
import { Sprout, BookOpen, Calculator as CalcIcon, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-linear-to-br from-primary-green to-primary-skyblue text-white py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Empowering a <span className="text-green-200">Greener</span> Future
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto text-blue-50">
            Join our student-led club in making our school and community more sustainable, one step at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/calculator" className="bg-white text-primary-green px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
              <CalcIcon className="w-5 h-5" />
              Calculate Impact
            </Link>
            <Link href="/posts" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-primary-skyblue hover:scale-105 transition-all flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5" />
              Our Research
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto py-24 px-4 grid md:grid-cols-3 gap-10">
        <div className="group p-10 rounded-3xl border border-gray-100 hover:border-primary-green transition-all bg-white shadow-sm hover:shadow-2xl">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-primary-green mb-6 group-hover:scale-110 transition-transform">
            <Sprout className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Eco Calculator</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Ever wondered how big your carbon footprint is? Use our custom tool to measure your daily impact on the planet.
          </p>
          <Link href="/calculator" className="text-primary-green font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
            Try it now <span className="text-xl">→</span>
          </Link>
        </div>

        <div className="group p-10 rounded-3xl border border-gray-100 hover:border-primary-skyblue transition-all bg-white shadow-sm hover:shadow-2xl">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary-skyblue mb-6 group-hover:scale-110 transition-transform">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Research & Posts</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Stay updated with our latest scientific papers, research projects, and club activities published by our members.
          </p>
          <Link href="/posts" className="text-primary-skyblue font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
            Explore posts <span className="text-xl">→</span>
          </Link>
        </div>

        <div className="group p-10 rounded-3xl border border-gray-100 hover:border-primary-green transition-all bg-white shadow-sm hover:shadow-2xl">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-primary-green mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Get Involved</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Our student-led initiative is always looking for passionate members. Join us at our next meeting or event!
          </p>
          <span className="text-gray-400 font-bold italic">Registration Opening Soon</span>
        </div>
      </section>

      {/* Quote Section */}
      <section className="w-full bg-gray-50 py-16 px-4 text-center italic text-gray-700">
        <blockquote className="text-2xl max-w-4xl mx-auto">
          &quot;The greatest threat to our planet is the belief that someone else will save it.&quot;
          <footer className="mt-4 not-italic font-bold text-lg text-primary-green">— Robert Swan</footer>
        </blockquote>
      </section>
    </div>
  );
}
