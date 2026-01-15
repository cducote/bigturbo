import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // BigTurbo Audit Design System colors
        audit: {
          // Backgrounds
          bg: 'var(--audit-bg)',
          'bg-alt': 'var(--audit-bg-alt)',
          'bg-accent': 'var(--audit-bg-accent)',

          // Text
          text: 'var(--audit-text)',
          'text-secondary': 'var(--audit-text-secondary)',
          'text-muted': 'var(--audit-text-muted)',
          'text-subtle': 'var(--audit-text-subtle)',

          // Borders
          border: 'var(--audit-border)',
          'border-muted': 'var(--audit-border-muted)',

          // Status
          success: 'var(--audit-success)',
          'success-bg': 'var(--audit-success-bg)',
          'success-text': 'var(--audit-success-text)',

          warning: 'var(--audit-warning)',
          'warning-bg': 'var(--audit-warning-bg)',
          'warning-text': 'var(--audit-warning-text)',

          error: 'var(--audit-error)',
          'error-bg': 'var(--audit-error-bg)',
          'error-text': 'var(--audit-error-text)',

          info: 'var(--audit-info)',
          'info-bg': 'var(--audit-info-bg)',
          'info-text': 'var(--audit-info-text)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
