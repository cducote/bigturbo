import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - BigTurbo',
  description: 'Learn more about BigTurbo, a modern Next.js SaaS starter kit',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          About BigTurbo
        </h1>

        <div className="mt-8 space-y-6 text-base leading-7 text-gray-600 dark:text-gray-400">
          <p>
            BigTurbo is a modern, production-ready SaaS starter kit built with the latest web technologies.
            It provides a solid foundation for building scalable, secure, and performant web applications.
          </p>

          <h2 className="mt-10 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Tech Stack
          </h2>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Frontend</h3>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Next.js 15 (App Router)</li>
                <li>React 19</li>
                <li>TypeScript (strict mode)</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Backend (Coming Soon)</h3>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Next.js API Routes & Server Actions</li>
                <li>Neon Postgres Database</li>
                <li>Clerk Authentication</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Developer Experience</h3>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>TypeScript strict mode</li>
                <li>ESLint configuration</li>
                <li>Path aliases (@/*)</li>
                <li>Hot module replacement</li>
              </ul>
            </div>
          </div>

          <h2 className="mt-10 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Features
          </h2>

          <ul className="mt-6 list-inside list-disc space-y-2">
            <li>Server Components by default for optimal performance</li>
            <li>Route groups for organized code structure</li>
            <li>Comprehensive error handling with error boundaries</li>
            <li>SEO-optimized with metadata API</li>
            <li>Dark mode support</li>
            <li>Responsive design</li>
            <li>Type-safe development</li>
            <li>Production-ready configuration</li>
          </ul>

          <h2 className="mt-10 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Getting Started
          </h2>

          <div className="mt-6">
            <p className="mb-4">To get started with development:</p>
            <pre className="rounded-lg bg-gray-100 dark:bg-gray-900 p-4 text-sm overflow-x-auto">
              <code>
{`npm install
npm run dev`}
              </code>
            </pre>
            <p className="mt-4">Open http://localhost:3000 to see your application.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
