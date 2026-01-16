# Automated Test Plan - BigTurbo Next.js Starter

**Version:** 1.0  
**Date:** 2026-01-14  
**Target Implementation:** Post-MVP (v0.2.0)  
**Automation Coverage Goal:** 70%

---

## Executive Summary

This document outlines the comprehensive automated testing strategy for the BigTurbo Next.js application. While the MVP will be validated through manual testing, this plan provides a roadmap for implementing robust test automation to support rapid, confident development and deployment cycles.

### Automation Benefits
- **Faster Feedback:** Catch regressions in minutes instead of hours
- **Confidence:** Deploy with certainty that core functionality works
- **Documentation:** Tests serve as living documentation
- **Refactoring Safety:** Safely refactor code with test coverage
- **CI/CD Integration:** Automate quality gates in deployment pipeline

---

## Testing Pyramid Strategy

```
           /\
          /  \
         / E2E \       10% - Critical user journeys
        /--------\
       /          \
      / Integration \   30% - Page and API integration
     /--------------\
    /                \
   /   Unit Tests     \  60% - Component and utility logic
  /--------------------\
```

### Coverage Goals
- **Unit Tests:** 80% code coverage
- **Integration Tests:** 70% of pages and API routes
- **E2E Tests:** 100% of critical user paths
- **Overall Automation:** 70% of manual test cases

---

## Testing Stack Recommendations

### Core Testing Framework

#### Option 1: Vitest (Recommended)
```json
{
  "devDependencies": {
    "vitest": "^1.1.0",
    "@vitest/ui": "^1.1.0",
    "@vitest/coverage-v8": "^1.1.0"
  }
}
```

**Pros:**
- Native ESM support
- Faster than Jest
- Better Next.js integration
- Built-in TypeScript support
- Excellent DX with Vite ecosystem

**Cons:**
- Newer ecosystem (less mature)
- Fewer community resources than Jest

#### Option 2: Jest (Alternative)
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.0"
  }
}
```

**Pros:**
- Most popular testing framework
- Extensive ecosystem
- Mature and stable
- Great documentation

**Cons:**
- Slower test execution
- ESM support requires configuration
- More complex setup

### React Testing

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0"
  }
}
```

### E2E Testing

#### Option 1: Playwright (Recommended)
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

**Pros:**
- Excellent documentation
- Built-in retry logic
- Cross-browser testing
- API testing capabilities
- Better for modern web apps

#### Option 2: Cypress (Alternative)
```json
{
  "devDependencies": {
    "cypress": "^13.6.0"
  }
}
```

**Pros:**
- Great DX with time-travel debugging
- Excellent documentation
- Component testing support
- Large community

---

## Test Structure

### Directory Organization

```
bigturbo/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── tests/
│   ├── unit/                 # Unit tests
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Header.test.tsx
│   │   │   │   └── Footer.test.tsx
│   │   └── lib/
│   ├── integration/          # Integration tests
│   │   ├── pages/
│   │   │   ├── home.test.tsx
│   │   │   ├── about.test.tsx
│   │   │   ├── not-found.test.tsx
│   │   │   └── error.test.tsx
│   │   └── api/
│   │       └── health.test.ts
│   ├── e2e/                  # End-to-end tests
│   │   ├── navigation.spec.ts
│   │   ├── error-handling.spec.ts
│   │   └── user-journey.spec.ts
│   ├── fixtures/             # Test data and mocks
│   ├── helpers/              # Test utilities
│   └── setup.ts              # Test configuration
├── vitest.config.ts
└── playwright.config.ts
```

---

## Unit Testing Strategy

### Components to Test

#### 1. Button Component (`/components/ui/Button.tsx`)

**Test File:** `tests/unit/components/ui/Button.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies primary variant styles by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('applies secondary variant styles when specified', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-600');
    });

    it('applies outline variant styles when specified', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('applies ghost variant styles when specified', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });
  });

  describe('Sizing', () => {
    it('applies medium size by default', () => {
      render(<Button>Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-10');
    });

    it('applies small size when specified', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-9');
    });

    it('applies large size when specified', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-12');
    });
  });

  describe('States', () => {
    it('handles disabled state correctly', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>);
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
    });

    it('has focus-visible styles', () => {
      render(<Button>Focus test</Button>);
      expect(screen.getByRole('button')).toHaveClass('focus-visible:outline-none');
    });
  });
});
```

**Coverage Target:** 95%+  
**Test Count:** 19 tests  
**Estimated Time:** 15 minutes to implement

#### 2. Header Component (`/components/ui/Header.tsx`)

**Test File:** `tests/unit/components/ui/Header.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/ui/Header';

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Header Component', () => {
  describe('Rendering', () => {
    it('renders the header element', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders the BigTurbo logo', () => {
      render(<Header />);
      expect(screen.getByText('BigTurbo')).toBeInTheDocument();
    });

    it('renders navigation links', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('logo links to home page', () => {
      render(<Header />);
      const logo = screen.getByText('BigTurbo').closest('a');
      expect(logo).toHaveAttribute('href', '/');
    });

    it('home link has correct href', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    });

    it('about link has correct href', () => {
      render(<Header />);
      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
    });
  });

  describe('Styling', () => {
    it('has border bottom', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toHaveClass('border-b');
    });

    it('logo has blue color', () => {
      render(<Header />);
      expect(screen.getByText('BigTurbo')).toHaveClass('text-blue-600');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic header element', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('uses semantic nav element', () => {
      render(<Header />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});
```

**Coverage Target:** 90%+  
**Test Count:** 11 tests  
**Estimated Time:** 10 minutes to implement

#### 3. Footer Component (`/components/ui/Footer.tsx`)

**Test File:** `tests/unit/components/ui/Footer.test.tsx`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/ui/Footer';

describe('Footer Component', () => {
  beforeEach(() => {
    // Mock date to ensure consistent year
    vi.setSystemTime(new Date('2026-01-14'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the footer element', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('displays copyright text with current year', () => {
      render(<Footer />);
      expect(screen.getByText(/© 2026 BigTurbo. All rights reserved./i)).toBeInTheDocument();
    });

    it('renders social media links', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /discord/i })).toBeInTheDocument();
    });
  });

  describe('External Links', () => {
    it('GitHub link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /github/i }))
        .toHaveAttribute('href', 'https://github.com');
    });

    it('Twitter link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /twitter/i }))
        .toHaveAttribute('href', 'https://twitter.com');
    });

    it('Discord link has correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /discord/i }))
        .toHaveAttribute('href', 'https://discord.com');
    });

    it('external links open in new tab', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link', { name: /github|twitter|discord/i });
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('external links have security attributes', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link', { name: /github|twitter|discord/i });
      links.forEach(link => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Dynamic Copyright Year', () => {
    it('updates year dynamically', () => {
      vi.setSystemTime(new Date('2027-01-01'));
      render(<Footer />);
      expect(screen.getByText(/© 2027 BigTurbo/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic footer element', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});
```

**Coverage Target:** 95%+  
**Test Count:** 12 tests  
**Estimated Time:** 10 minutes to implement

---

## Integration Testing Strategy

### Pages to Test

#### 1. Home Page (`/app/(marketing)/page.tsx`)

**Test File:** `tests/integration/pages/home.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/(marketing)/page';

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Home Page Integration', () => {
  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      render(<HomePage />);
      expect(screen.getByText('Welcome to BigTurbo')).toBeInTheDocument();
    });

    it('renders hero section', () => {
      render(<HomePage />);
      expect(screen.getByRole('heading', { name: /welcome to bigturbo/i })).toBeInTheDocument();
    });

    it('renders hero description', () => {
      render(<HomePage />);
      expect(screen.getByText(/A modern SaaS starter kit/i)).toBeInTheDocument();
    });
  });

  describe('Call-to-Action Buttons', () => {
    it('renders Get Started button', () => {
      render(<HomePage />);
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('renders Learn More button', () => {
      render(<HomePage />);
      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });

    it('Get Started button links to about page', () => {
      render(<HomePage />);
      const button = screen.getByRole('button', { name: /get started/i });
      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/about');
    });

    it('Learn More button links to about page', () => {
      render(<HomePage />);
      const button = screen.getByRole('button', { name: /learn more/i });
      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/about');
    });
  });

  describe('Feature Grid', () => {
    it('renders all three feature cards', () => {
      render(<HomePage />);
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(screen.getByText('Secure by Default')).toBeInTheDocument();
      expect(screen.getByText('Developer Experience')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      render(<HomePage />);
      expect(screen.getByText(/Built on Next.js 15/i)).toBeInTheDocument();
      expect(screen.getByText(/TypeScript strict mode/i)).toBeInTheDocument();
      expect(screen.getByText(/Hot reload/i)).toBeInTheDocument();
    });

    it('renders feature icons', () => {
      const { container } = render(<HomePage />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HomePage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Welcome to BigTurbo');
    });

    it('feature cards have proper structure', () => {
      const { container } = render(<HomePage />);
      const dlElement = container.querySelector('dl');
      expect(dlElement).toBeInTheDocument();
    });
  });
});
```

**Coverage Target:** 85%+  
**Test Count:** 13 tests  
**Estimated Time:** 15 minutes to implement

#### 2. About Page (`/app/(marketing)/about/page.tsx`)

**Test File:** `tests/integration/pages/about.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutPage from '@/app/(marketing)/about/page';

describe('About Page Integration', () => {
  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /about bigturbo/i })).toBeInTheDocument();
    });

    it('renders introduction text', () => {
      render(<AboutPage />);
      expect(screen.getByText(/production-ready SaaS starter kit/i)).toBeInTheDocument();
    });
  });

  describe('Tech Stack Section', () => {
    it('renders Tech Stack heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /tech stack/i })).toBeInTheDocument();
    });

    it('lists frontend technologies', () => {
      render(<AboutPage />);
      expect(screen.getByText(/Next.js 15/i)).toBeInTheDocument();
      expect(screen.getByText(/React 19/i)).toBeInTheDocument();
      expect(screen.getByText(/TypeScript \(strict mode\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Tailwind CSS/i)).toBeInTheDocument();
    });

    it('lists backend technologies', () => {
      render(<AboutPage />);
      expect(screen.getByText(/Neon Postgres/i)).toBeInTheDocument();
      expect(screen.getByText(/Clerk Authentication/i)).toBeInTheDocument();
    });

    it('lists developer experience features', () => {
      render(<AboutPage />);
      expect(screen.getByText(/ESLint configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/Hot module replacement/i)).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('renders Features heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /^features$/i })).toBeInTheDocument();
    });

    it('lists all features', () => {
      render(<AboutPage />);
      expect(screen.getByText(/Server Components by default/i)).toBeInTheDocument();
      expect(screen.getByText(/Route groups/i)).toBeInTheDocument();
      expect(screen.getByText(/error boundaries/i)).toBeInTheDocument();
      expect(screen.getByText(/SEO-optimized/i)).toBeInTheDocument();
      expect(screen.getByText(/Dark mode support/i)).toBeInTheDocument();
      expect(screen.getByText(/Responsive design/i)).toBeInTheDocument();
    });
  });

  describe('Getting Started Section', () => {
    it('renders Getting Started heading', () => {
      render(<AboutPage />);
      expect(screen.getByRole('heading', { name: /getting started/i })).toBeInTheDocument();
    });

    it('displays installation commands', () => {
      render(<AboutPage />);
      expect(screen.getByText(/npm install/i)).toBeInTheDocument();
      expect(screen.getByText(/npm run dev/i)).toBeInTheDocument();
    });

    it('renders code block with proper styling', () => {
      const { container } = render(<AboutPage />);
      const codeBlock = container.querySelector('pre');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock).toHaveClass('rounded-lg');
    });
  });

  describe('Content Structure', () => {
    it('has proper heading hierarchy', () => {
      render(<AboutPage />);
      const h1 = screen.getByRole('heading', { level: 1, name: /about bigturbo/i });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('uses lists appropriately', () => {
      const { container } = render(<AboutPage />);
      const lists = container.querySelectorAll('ul');
      expect(lists.length).toBeGreaterThan(0);
    });
  });
});
```

**Coverage Target:** 85%+  
**Test Count:** 14 tests  
**Estimated Time:** 15 minutes to implement

#### 3. 404 Page (`/app/not-found.tsx`)

**Test File:** `tests/integration/pages/not-found.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('404 Not Found Page Integration', () => {
  it('renders 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument();
  });

  it('renders Page Not Found heading', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<NotFound />);
    expect(screen.getByText(/does not exist or has been moved/i)).toBeInTheDocument();
  });

  it('renders Go Home link', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: /go home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('is centered on the page', () => {
    const { container } = render(<NotFound />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('justify-center');
  });
});
```

**Coverage Target:** 95%+  
**Test Count:** 5 tests  
**Estimated Time:** 5 minutes to implement

#### 4. Error Page (`/app/error.tsx`)

**Test File:** `tests/integration/pages/error.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Error from '@/app/error';

describe('Error Page Integration', () => {
  const mockError = new Error('Test error');
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders error heading', () => {
    render(<Error error={mockError} reset={mockReset} />);
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Error error={mockError} reset={mockReset} />);
    expect(screen.getByText(/we apologize for the inconvenience/i)).toBeInTheDocument();
  });

  it('renders Try again button', () => {
    render(<Error error={mockError} reset={mockReset} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays error digest if present', () => {
    const errorWithDigest = { ...mockError, digest: 'error-123' };
    render(<Error error={errorWithDigest} reset={mockReset} />);
    expect(screen.getByText(/error id: error-123/i)).toBeInTheDocument();
  });

  it('does not display error digest if not present', () => {
    render(<Error error={mockError} reset={mockReset} />);
    expect(screen.queryByText(/error id:/i)).not.toBeInTheDocument();
  });

  it('calls reset function when Try again button is clicked', async () => {
    const user = userEvent.setup();
    render(<Error error={mockError} reset={mockReset} />);
    
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('logs error to console on mount', () => {
    render(<Error error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Application error:', mockError);
  });
});
```

**Coverage Target:** 90%+  
**Test Count:** 7 tests  
**Estimated Time:** 10 minutes to implement

### API Routes to Test

#### Health Endpoint (`/app/api/health/route.ts`)

**Test File:** `tests/integration/api/health.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('Health API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-01-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 200 status', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('returns JSON response', async () => {
    const response = await GET();
    const contentType = response.headers.get('Content-Type');
    expect(contentType).toContain('application/json');
  });

  it('includes status field', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  it('includes timestamp field with ISO format', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.timestamp).toBeDefined();
    expect(data.timestamp).toBe('2026-01-14T12:00:00.000Z');
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it('includes uptime field with numeric value', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.uptime).toBeDefined();
    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('includes environment field', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.environment).toBeDefined();
    expect(['development', 'production', 'test']).toContain(data.environment);
  });

  it('includes version field', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data.version).toBeDefined();
    expect(data.version).toBe('0.1.0');
  });

  it('includes Cache-Control header', async () => {
    const response = await GET();
    const cacheControl = response.headers.get('Cache-Control');
    
    expect(cacheControl).toBe('no-store, must-revalidate');
  });

  it('returns fresh data on each request', async () => {
    const response1 = await GET();
    const data1 = await response1.json();
    
    // Advance time
    vi.setSystemTime(new Date('2026-01-14T12:01:00.000Z'));
    
    const response2 = await GET();
    const data2 = await response2.json();
    
    expect(data1.timestamp).not.toBe(data2.timestamp);
  });

  it('handles test environment', async () => {
    process.env.NODE_ENV = 'test';
    
    const response = await GET();
    const data = await response.json();
    
    expect(data.environment).toBe('test');
  });
});
```

**Coverage Target:** 95%+  
**Test Count:** 10 tests  
**Estimated Time:** 15 minutes to implement

---

## End-to-End Testing Strategy

### Critical User Journeys

#### 1. Navigation Flow

**Test File:** `tests/e2e/navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation Flow', () => {
  test('should navigate from home to about page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Verify we're on home page
    await expect(page).toHaveTitle(/BigTurbo - Next.js SaaS Starter/);
    await expect(page.locator('h1')).toContainText('Welcome to BigTurbo');
    
    // Click About link in header
    await page.click('text=About');
    
    // Verify we're on about page
    await expect(page).toHaveURL('http://localhost:3000/about');
    await expect(page).toHaveTitle(/About - BigTurbo/);
    await expect(page.locator('h1')).toContainText('About BigTurbo');
  });

  test('should navigate back to home using logo', async ({ page }) => {
    await page.goto('http://localhost:3000/about');
    
    // Click logo
    await page.click('text=BigTurbo');
    
    // Verify we're back on home page
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('h1')).toContainText('Welcome to BigTurbo');
  });

  test('should navigate using CTA buttons', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Click Get Started button
    await page.click('button:has-text("Get Started")');
    
    // Verify navigation to about page
    await expect(page).toHaveURL('http://localhost:3000/about');
  });

  test('should handle browser back button', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('text=About');
    
    // Use browser back
    await page.goBack();
    
    // Verify we're back on home page
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should handle browser forward button', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('text=About');
    await page.goBack();
    
    // Use browser forward
    await page.goForward();
    
    // Verify we're on about page again
    await expect(page).toHaveURL('http://localhost:3000/about');
  });
});
```

**Test Count:** 5 tests  
**Estimated Time:** 20 minutes to implement

#### 2. Error Handling Flow

**Test File:** `tests/e2e/error-handling.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should display 404 page for invalid route', async ({ page }) => {
    await page.goto('http://localhost:3000/invalid-route');
    
    // Verify 404 page displays
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('h2')).toContainText('Page Not Found');
    await expect(page.locator('p')).toContainText('does not exist or has been moved');
  });

  test('should navigate home from 404 page', async ({ page }) => {
    await page.goto('http://localhost:3000/invalid-route');
    
    // Click Go Home button
    await page.click('text=Go Home');
    
    // Verify navigation to home page
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('h1')).toContainText('Welcome to BigTurbo');
  });

  test('should handle multiple invalid routes', async ({ page }) => {
    const invalidRoutes = [
      '/does-not-exist',
      '/invalid',
      '/test/deep/route',
      '/random-123'
    ];
    
    for (const route of invalidRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      await expect(page.locator('h1')).toContainText('404');
    }
  });
});
```

**Test Count:** 3 tests  
**Estimated Time:** 15 minutes to implement

#### 3. Complete User Journey

**Test File:** `tests/e2e/user-journey.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('new user explores the application', async ({ page }) => {
    // 1. Land on home page
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('Welcome to BigTurbo');
    
    // 2. Read feature cards
    await expect(page.locator('text=Lightning Fast')).toBeVisible();
    await expect(page.locator('text=Secure by Default')).toBeVisible();
    await expect(page.locator('text=Developer Experience')).toBeVisible();
    
    // 3. Click Learn More button
    await page.click('button:has-text("Learn More")');
    await expect(page).toHaveURL('http://localhost:3000/about');
    
    // 4. Read about page content
    await expect(page.locator('h1')).toContainText('About BigTurbo');
    await expect(page.locator('text=Next.js 15')).toBeVisible();
    
    // 5. Check API health (simulate checking system status)
    const response = await page.goto('http://localhost:3000/api/health');
    expect(response?.status()).toBe(200);
    const data = await response?.json();
    expect(data.status).toBe('ok');
    
    // 6. Navigate back to home via header
    await page.goto('http://localhost:3000/about');
    await page.click('text=Home');
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // 7. Try invalid route (test error handling)
    await page.goto('http://localhost:3000/invalid');
    await expect(page.locator('h1')).toContainText('404');
    
    // 8. Return home from error page
    await page.click('text=Go Home');
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});
```

**Test Count:** 1 comprehensive test  
**Estimated Time:** 15 minutes to implement

#### 4. Responsive Design E2E

**Test File:** `tests/e2e/responsive.spec.ts`

```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('renders correctly on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000');
    
    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
    
    // Check navigation is accessible
    await page.click('text=About');
    await expect(page).toHaveURL('http://localhost:3000/about');
    
    await context.close();
  });

  test('renders correctly on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro'],
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Lightning Fast')).toBeVisible();
    
    await context.close();
  });

  test('renders correctly on desktop', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000');
    
    // Verify desktop layout with feature grid
    const features = page.locator('dl').first();
    await expect(features).toBeVisible();
    
    await context.close();
  });
});
```

**Test Count:** 3 tests  
**Estimated Time:** 20 minutes to implement

#### 5. Accessibility E2E

**Test File:** `tests/e2e/accessibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('about page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/about');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('404 page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/invalid');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // Home link
    await page.keyboard.press('Tab'); // About link
    await page.keyboard.press('Tab'); // Get Started button
    
    // Verify focus is visible
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    await expect(focusedElement).toBeTruthy();
  });
});
```

**Test Count:** 4 tests  
**Estimated Time:** 25 minutes to implement  
**Note:** Requires `@axe-core/playwright` package

---

## Test Configuration

### Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        '*.config.ts',
        '*.config.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**/*', 'node_modules/'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File

**File:** `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      pathname: '/',
      query: {},
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
```

### Playwright Configuration

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Package.json Scripts

Add the following scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run --config vitest.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.17.0'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Build application
        run: npm run build

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.17.0'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-videos
          path: test-results/
          retention-days: 7
```

---

## Implementation Roadmap

### Phase 1: Setup (Week 1)

**Day 1-2: Framework Setup**
- [ ] Install Vitest and React Testing Library
- [ ] Install Playwright
- [ ] Create test configuration files
- [ ] Set up test directory structure
- [ ] Configure path aliases for tests
- [ ] Create test setup files

**Day 3-4: CI/CD Integration**
- [ ] Create GitHub Actions workflow
- [ ] Set up code coverage reporting
- [ ] Configure test result artifacts
- [ ] Set up status checks

**Day 5: Documentation**
- [ ] Document testing conventions
- [ ] Create testing guidelines
- [ ] Write contribution guide for tests

### Phase 2: Unit Tests (Week 2)

**Day 1: Button Component**
- [ ] Write 19 unit tests
- [ ] Achieve 95%+ coverage
- [ ] Document testing patterns

**Day 2: Header Component**
- [ ] Write 11 unit tests
- [ ] Achieve 90%+ coverage
- [ ] Test navigation links

**Day 3: Footer Component**
- [ ] Write 12 unit tests
- [ ] Achieve 95%+ coverage
- [ ] Test dynamic year and external links

**Day 4-5: Additional Components**
- [ ] Add tests for any new components
- [ ] Refactor test utilities
- [ ] Review code coverage

### Phase 3: Integration Tests (Week 3)

**Day 1: Home Page**
- [ ] Write 13 integration tests
- [ ] Test hero section and features
- [ ] Verify CTA functionality

**Day 2: About Page**
- [ ] Write 14 integration tests
- [ ] Test all content sections
- [ ] Verify code blocks

**Day 3: Error Pages**
- [ ] Write 5 tests for 404 page
- [ ] Write 7 tests for error boundary
- [ ] Test error recovery

**Day 4: API Routes**
- [ ] Write 10 tests for health endpoint
- [ ] Mock external dependencies
- [ ] Test error scenarios

**Day 5: Review and Refactor**
- [ ] Review all integration tests
- [ ] Refactor common patterns
- [ ] Update documentation

### Phase 4: E2E Tests (Week 4)

**Day 1: Navigation**
- [ ] Write 5 E2E tests
- [ ] Test all navigation flows
- [ ] Verify browser history

**Day 2: Error Handling**
- [ ] Write 3 E2E tests
- [ ] Test 404 scenarios
- [ ] Verify recovery paths

**Day 3: User Journeys**
- [ ] Write comprehensive journey test
- [ ] Test complete user flows
- [ ] Verify API integration

**Day 4: Responsive & Accessibility**
- [ ] Write 3 responsive tests
- [ ] Write 4 accessibility tests
- [ ] Test keyboard navigation

**Day 5: Polish and Deploy**
- [ ] Run full test suite
- [ ] Fix any flaky tests
- [ ] Update CI/CD pipeline
- [ ] Deploy automated tests

---

## Success Metrics

### Coverage Targets

| Category | Target | Deadline |
|----------|--------|----------|
| Unit Test Coverage | 80% | End of Week 2 |
| Integration Test Coverage | 70% | End of Week 3 |
| E2E Critical Path Coverage | 100% | End of Week 4 |
| Overall Automation | 70% | End of Week 4 |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Test Execution Time (Unit) | < 30 seconds |
| Test Execution Time (E2E) | < 5 minutes |
| Test Flakiness Rate | < 1% |
| Test Maintenance Time | < 10% of dev time |
| CI/CD Pipeline Success Rate | > 95% |

### Business Impact

| Metric | Target |
|--------|--------|
| Regression Detection Rate | > 90% |
| Time to Deploy | < 15 minutes |
| Production Incidents | < 1 per month |
| Developer Confidence | High |
| Release Frequency | Daily capable |

---

## Maintenance and Best Practices

### Test Maintenance

1. **Keep Tests Updated**
   - Update tests when features change
   - Remove tests for deprecated features
   - Refactor tests to match code refactoring

2. **Fix Flaky Tests Immediately**
   - Investigate root cause
   - Add proper waits and retries
   - Remove or rewrite if unfixable

3. **Monitor Test Performance**
   - Keep test execution fast
   - Parallelize where possible
   - Use test.only for focused testing

4. **Review Test Coverage**
   - Weekly coverage reports
   - Identify gaps in coverage
   - Add tests for new features

### Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal implementation details
   - Test contracts, not internals

2. **Write Clear Test Names**
   - Use descriptive test names
   - Follow pattern: "should [expected behavior] when [condition]"
   - Make failures easy to understand

3. **Keep Tests Independent**
   - No test dependencies
   - Each test can run in isolation
   - Clean up after tests

4. **Use Test Data Factories**
   - Create reusable test data
   - Keep tests DRY
   - Make data generation explicit

5. **Mock External Dependencies**
   - Don't call real APIs in tests
   - Use MSW for API mocking
   - Mock time-dependent code

---

## Appendix

### Required Dependencies

```json
{
  "devDependencies": {
    "@axe-core/playwright": "^4.8.0",
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@vitest/coverage-v8": "^1.1.0",
    "@vitest/ui": "^1.1.0",
    "jsdom": "^23.0.0",
    "vitest": "^1.1.0"
  }
}
```

### Installation Commands

```bash
# Install unit testing dependencies
npm install -D vitest @vitest/ui @vitest/coverage-v8 @vitejs/plugin-react

# Install React Testing Library
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install Playwright
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install

# Install accessibility testing
npm install -D @axe-core/playwright

# Install jsdom for DOM testing
npm install -D jsdom
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-14  
**Next Review:** After implementation completion  
**Owner:** QA Expert Agent
