import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

/**
 * Strict TypeScript Interface derived from the Payload CMS schema.
 */
interface HeroProps {
  title: string;
  description: string;
  cta_button: string;
}

/**
 * Hero Component
 * 
 * A high-impact Server Component designed for the Payload CMS Hero block.
 * Uses W3C Design Tokens via CSS variables for full themeability.
 * 
 * @param props - The content for the Hero section.
 */
export default function Hero({ title, description, cta_button }: HeroProps) {
  return (
    <section className="relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden bg-[var(--color-bluedark)]">
      {/* 
        Background Image 
        Note: Since the strict interface does not provide a backgroundImage URL, 
        a placeholder is used to demonstrate the implementation of next/image.
      */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1557683316-d5760100066d?q=80&w=2070&auto=format&fit=crop"
          alt="" // Decorative image, alt is empty for A11y
          fill
          priority
          className="object-cover opacity-40"
        />
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-bluedark)]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[var(--container-width)] mx-auto px-4 py-20 text-center">
        <article className="flex flex-col items-center">
          
          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[var(--color-white)] tracking-tight mb-6">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="max-w-2xl text-lg md:text-xl text-[var(--color-light-accent)] mb-10 leading-relaxed">
              {description}
            </p>
          )}

          {/* Call to Action */}
          {cta_button && (
            <a
              href="#cta"
              aria-label={cta_button}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-main)] text-[var(--color-white)] font-bold rounded-md transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-95"
            >
              <span>{cta_button}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          )}
          
        </article>
      </div>
    </section>
  );
}