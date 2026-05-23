import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Props derived from the Payload CMS schema.
 * Note: backgroundImage is included as an optional prop to satisfy 
 * the specific instruction regarding next/image usage.
 */
interface CardGridProps {
  title: string;
  description: string;
  cta_button: string;
  backgroundImage?: string;
}

/**
 * CardGrid Component
 * A semantic, accessible Server Component designed for a Payload CMS UI block.
 * Uses W3C Design Tokens via CSS variables for full themeability.
 */
export default function CardGrid({
  title,
  description,
  cta_button,
  backgroundImage,
}: CardGridProps) {
  return (
    <section 
      className="w-full py-12 flex justify-center"
      aria-labelledby="card-grid-title"
    >
      <div 
        className="w-[var(--container-width)]"
        style={{ maxWidth: 'calc(100% - 20px)' }}
      >
        <article 
          className="relative overflow-hidden rounded-xl border border-[var(--color-bluegray)] bg-[var(--color-white)] p-8 md:p-12 transition-shadow hover:shadow-lg"
        >
          {/* Background Image Layer */}
          {backgroundImage && (
            <div className="absolute inset-0 -z-10 opacity-10">
              <Image
                src={backgroundImage}
                alt=""
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-start gap-6">
            {/* Header Section */}
            <header className="space-y-2">
              <h2 
                id="card-grid-title"
                className="text-3xl font-bold tracking-tight text-[var(--color-black)] md:text-4xl"
              >
                {title}
              </h2>
              <div className="h-1 w-12 bg-[var(--color-skyblue)]" />
            </header>

            {/* Content Section */}
            <div className="max-w-2xl">
              <p className="text-lg leading-relaxed text-[var(--color-bluegray)]">
                {description}
              </p>
            </div>

            {/* Action Section */}
            {cta_button && (
              <Link
                href="#"
                className="group inline-flex items-center gap-2 rounded-md bg-[var(--color-skyblue)] px-6 py-3 text-sm font-bold text-[var(--color-white)] transition-all hover:bg-[var(--color-bluepurple)] hover:shadow-md active:scale-95"
                aria-label={`${cta_button} (opens in new tab)`}
              >
                {cta_button}
                <ArrowRight 
                  className="transition-transform group-hover:translate-x-1" 
                  size={18} 
                />
              </Link>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}