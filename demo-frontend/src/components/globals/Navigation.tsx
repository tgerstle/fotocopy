import React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { MobileNavToggle } from './MobileNavToggle'; // We will define this as a small client component below

/**
 * Navigation.tsx
 * 
 * A Singleton Shell block for Payload CMS.
 * Acts as the global layout wrapper, providing the Navigation header 
 * and wrapping the page content (children) in a semantic <main> container.
 */

interface NavigationProps {
  children?: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  return (
    <>
      {/* Accessibility: Skip to Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-[var(--color-skyblue)] focus:text-[var(--color-white)] focus:p-4 focus:rounded-md"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 w-full bg-[var(--nav-color-white)] border-b border-[var(--color-bluegray)]/20">
        <div className="nav-sticky-wrap mx-auto">
          <nav 
            className="nav nav--desktop flex items-center justify-between h-16 px-[var(--navXPadding)]"
            aria-label="Global Navigation"
          >
            {/* Logo Section */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="text-[var(--color-black)] font-[700] text-xl tracking-tight"
                aria-label="Home"
              >
                LOGO
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <NavLinks />
            </div>

            {/* Mobile Menu Trigger (Client Component) */}
            <div className="md:hidden flex items-center">
              <MobileNavToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Wrapper */}
      <main id="main-content" className="min-h-screen">
        <div className="mx-auto w-[var(--container-width)]">
          {children}
        </div>
      </main>
    </>
  );
}

/**
 * NavLinks Component
 * Server Component for desktop navigation links
 */
function NavLinks() {
  const links = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <ul className="flex items-center gap-8 list-none m-0 p-0">
      {links.map((link) => (
        <li key={link.name}>
          <Link
            href={link.href}
            className="text-[var(--color-black)] hover:text-[var(--color-skyblue)] transition-colors duration-200 font-medium"
          >
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * NOTE: In a real Next.js project, the following Client Components 
 * should be in their own files with 'use client' at the top.
 * I am including them here for a single-file delivery.
 */

// --- MobileNavToggle.tsx ---
'use client';
import { useState } from 'unset'; // This is a placeholder for the logic below

// Since I must output Navigation.tsx, I will provide the logic 
// as if it were a separate client component.

/* 
// File: MobileNavToggle.tsx
'use client';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function MobileNavToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[var(--color-black)] hover:bg-[var(--color-bluegray)]/10 rounded-md transition-colors"
        aria_expanded={isOpen}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--nav-color-white)] border border-[var(--color-bluegray)]/20 shadow-xl rounded-lg p-4 md:hidden">
          <ul className="flex flex-col gap-4 list-none m-0 p-0">
            {links.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-[var(--color-black)] hover:text-[var(--color-skyblue)] py-2 transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
*/