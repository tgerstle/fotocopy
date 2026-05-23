import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Strict TypeScript Interface derived from the consolidated schema.
 * Note: Hyphenated keys are defined as string literals to match the JSON schema.
 */
interface RichTextProps {
  title: string;
  description: string;
  cta_button: string;
  'subtitle-1': string;
  'subtitle-2': string;
  'subtitle-2-alt': string;
  'mappings-1': string;
  'mappings-1-alt': string;
}

/**
 * RichText Component
 * A semantic, accessible, and themeable Server Component for Payload CMS.
 * 
 * Design System: Uses W3C Design Tokens via CSS Variables.
 * Constraints: No hardcoded hex codes; uses Tailwind CSS with variable mapping.
 */
export default function RichText({
  title,
  description,
  cta_button,
  'subtitle-1': subtitle1,
  'subtitle-2': subtitle2,
  'subtitle-2-cap': subtitle2Alt, // Mapping subtitle-2-alt
  'mappings-1': mapping1,
  'mappings-1-alt': mapping1Alt,
}: RichTextProps) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-[var(--color-background)]">
      {/* 
        Decorative Background Element 
        Using next/image as requested for a background effect.
        Since the schema does not provide a specific image URL, 
        we use a placeholder pattern to satisfy the requirement.
      */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <Image
          src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-background)]" />
      </div>

      <div className="container mx-auto px-5 max-w-[var(--container-width)]">
        <article className="flex flex-col items-center text-center space-y-6">
          
          {/* Subtitle 1: Eyebrow Text */}
          {subtitle1 && (
            <span className="text-[var(--color-bluegray)] uppercase tracking-widest text-sm font-bold">
              {subtitle1}
            </span>
          )}

          {/* Main Title */}
          {title && (
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-black)] leading-tight">
              {title}
            </h2>
          )}

          {/* Subtitle 2 & Subtitle 2 Alt: Secondary Headings */}
          <div className="space-y-2">
            {subtitle2 && (
              <p className="text-xl md:text-2xl text-[var(--color-bluepurple)] font-medium">
                {subtitle2}
              </p>
            )}
            {subtitle2Alt && (
              <p className="text-lg text-[var(--color-bluegray)] italic">
                {subtitle2Alt}
              </p>
            )}
          </div>

          {/* Main Description */}
          {description && (
            <p className="max-w-2xl text-[var(--color-primary)] text-base md:text-lg leading-relaxed">
              {description}
            </p>
          )}

          {/* Mappings Section: Feature/Tag List */}
          {(mapping1 || mapping1Alt) && (
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {mapping1 && (
                <span className="px-4 py-1 rounded-full border border-[var(--color-bluegray)] text-[var(--color-bluegray)] text-sm">
                  {mapping1}
                </span>
              )}
              {mapping1Alt && (
                <span className="px-4 py-1 rounded-full bg-[var(--color-bluegray)] text-[var(--color-white)] text-sm">
                  {mapping1Alt}
                </span>
              )}
            </div>
          )}

          {/* Call to Action */}
          {cta_button && (
            <div className="pt-8">
              <Link
                href="#"
                aria-label={cta_button}
                className="inline-flex items-center justify-center px-8 py-3 rounded-md font-bold text-[var(--color-white)] bg-[var(--color-main)] hover:opacity-90 transition-all duration-200 group"
              >
                {cta_button}
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}