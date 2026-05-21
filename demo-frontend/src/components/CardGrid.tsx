import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Props derived directly from the consolidated schema shape.
 * Added backgroundImage as an optional prop to satisfy the requirement 
 * for using next/image for background implementation.
 */
interface CardGridProps {
  title: string;
  description: string;
  cta_button: string;
  backgroundImage?: string; // Optional to maintain strictness with core schema
}

/**
 * CardGrid Component
 * A Server Component designed as a UI block for Payload CMS.
 * Uses W3C Design Tokens via CSS variables and Tailwind CSS.
 */
const CardGrid: React.FC<CardGridProps> = ({
  title,
  description,
  cta_button,
  backgroundImage,
}) => {
  return (
    <section 
      className="relative overflow-hidden py-16 md:py-24 flex justify-center"
      aria-labelledby="card-grid-title"
    >
      {/* Background Image Layer */}
      {backgroundImage && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
      )}

      {/* Decorative Gradient Overlay to ensure text readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-[var(--color-white)]" />

      <div className="w-[var(--container-width)]">
        <article className="group relative flex flex-col items-start gap-6 p-8 md:p-12 rounded-2xl border border-[var(--color-bluegray)]/20 bg-[rgba(255,255,255,0.05)] backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-bluepurple)]/10">
          
          {/* Content Wrapper */}
          <div className="flex flex-col gap-4 max-w-2xl">
            <h2 
              id="card-grid-title"
              className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-black)]"
            >
              {title}
            </h2>
            
            {description && (
              <p className="text-lg md:text-xl leading-relaxed text-[var(--color-bluegray)]">
                {description}
              </p>
            )}
          </div>

          {/* Call to Action */}
          {cta_button && (
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[var(--color-white)] bg-[var(--color-main)] hover:bg-[var(--color-dark)] transition-colors duration-200 group/btn"
              aria-label={`${cta_button} action`}
            >
              <span>{cta_button}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </Link>
          )}
        </article>
      </div>
    </section>
  );
};

export default CardGrid;