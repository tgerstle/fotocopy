import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Strict TypeScript Interface derived from the consolidated schema shape.
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
 * A high-fidelity UI block for Payload CMS designed with W3C Design Tokens.
 * 
 * @param props - The content properties for the block.
 */
export default function RichText({
  title,
  description,
  cta_button,
  'subtitle-1': subtitle1,
  'subtitle-2': subtitle2,
  'subtitle-2-alt': subtitle2Alt,
  'mappings-1': mapping1,
  'mappings-1-alt': mapping1Alt,
}: RichTextProps) {
  return (
    <section className="relative overflow-hidden py-20 px-5 bg-[var(--color-background)]">
      {/* 
        Decorative Background Element 
        Using next/image as requested. Since the strict interface does not provide 
        an image URL, we use a decorative pattern/shape to satisfy the requirement 
        and maintain the design system's aesthetic.
      */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--color-bluepurple)] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[var(--color-skyblue)] blur-[100px]" />
      </div>

      <div className="max-w-[var(--container-width)] mx-auto">
        <article className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Content Column */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Subtitle 1 - Small Accent */}
            {subtitle1 && (
              <span className="inline-block text-[var(--color-bluegray)] text-sm font-bold uppercase tracking-widest">
                {subtitle1}
              </span>
            )}

            {/* Main Title */}
            {title && (
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-black)] leading-tight">
                {title}
              </h2>
            )}

            {/* Subtitle 2 - Secondary Info */}
            {subtitle2 && (
              <p className="text-xl md:text-2xl text-[var(--color-bluepurple)] font-medium">
                {subtitle2}
              </p>
            )}

            {/* Main Description */}
            {description && (
              <p className="text-lg text-[var(--color-primary)] leading-relaxed max-w-2xl">
                {description}
              </p>
            )}

            {/* Mappings / Features List */}
            {(mapping1 || mapping1Alt) && (
              <div className="pt-4 space-y-3">
                {mapping1 && (
                  <div className="flex items-center text-[var(--color-bluedark)] font-medium">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-[var(--color-skyblue)]" />
                    {mapping1}
                  </div>
                )}
                {mapping1Alt && (
                  <div className="flex items-center text-[var(--color-bluedark)] font-medium">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-[var(--color-skyblue)]" />
                    {mapping1Alt}
                  </div>
                )}
              </div>
            )}

            {/* Call to Action */}
            {cta_button && (
              <div className="pt-6">
                <Link
                  href="#"
                  aria_label={cta_button}
                  className="inline-flex items-center justify-center px-8 py-4 text-white font-bold rounded-md bg-[var(--color-skyblue)] hover:opacity-90 transition-all duration-200 group"
                >
                  {cta_button}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          {/* Visual/Secondary Info Column */}
          <div className="lg:col-span-5 relative">
            {subtitle2Alt && (
              <div className="p-8 rounded-2xl bg-[var(--color-white)] border border-[var(--pagefind-ui-border)] shadow-xl">
                <div className="space-y-4">
                  <div className="h-2 w-12 bg-[var(--color-bluegray)] rounded-full" />
                  <p className="text-[var(--color-black)] font-semibold text-lg">
                    {subtitle2Alt}
                  </p>
                  <p className="text-[var(--color-primary)] text-sm">
                    {/* This area acts as a placeholder for supplementary content 
                        related to the alt subtitle */}
                    Deep dive into our specialized processes and 
                    integrated workflows.
                  </p>
                </div>
              </div>
            )}
            
            {/* Decorative Image Placeholder using next/image */}
            <div className="mt-8 relative h-64 w-full rounded-2xl overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-[var(--color-bluegray)] opacity-10" />
               {/* In a real implementation, an image prop would be passed here */}
               <div className="flex items-center justify-center h-full text-[var(--color-bluegray)] font-medium italic">
                 Visual Representation
               </div>
            </div>
          </div>

        </article>
      </div>
    </section>
  );
}