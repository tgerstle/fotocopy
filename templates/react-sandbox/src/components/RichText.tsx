import React from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

/**
 * Strict TypeScript Interface derived from the consolidated schema.
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
 * A semantic, accessible UI block designed for Payload CMS.
 * Uses W3C Design Tokens via CSS variables.
 */
export const RichText: React.FC<RichTextProps> = ({
  title,
  description,
  cta_button,
  'subtitle-1': subtitle1,
  'subtitle-2': subtitle2,
  'subtitle-2-alt': subtitle2Alt,
  'mappings-1': mappings1,
  'mappings-1-alt': mappings1Alt,
}) => {
  return (
    <section 
      className="relative overflow-hidden py-16 px-6 md:py-24 md:px-12 bg-[var(--color-background)]"
      aria-labelledby="rich-text-heading"
    >
      {/* 
        Note: next/image is imported as per instructions. 
        In a real implementation, a backgroundImage prop would be passed here.
      */}
      
      <div className="max-w-4xl mx-auto flex flex-col items-start gap-6">
        {/* Top Label / Eyeline */}
        {subtitle1 && (
          <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-primary)] opacity-70">
            {subtitle1}
          </span>
        )}

        {/* Subtitle Layer */}
        <div className="flex flex-col gap-2">
          {subtitle2 && (
            <h3 className="text-xl md:text-2xl font-medium text-[var(--color-primary)]">
              {subtitle2}
            </h3>
          )}
          {subtitle2Alt && (
            <span className="text-sm text-[var(--color-primary)] opacity-60">
              {subtitle2Alt}
            </span>
          )}
        </div>

        {/* Main Heading */}
        <h2 
          id="rich-text-heading" 
          className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--color-primary)]"
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-lg md:text-xl text-[var(--color-primary)] opacity-80 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}

        {/* Mappings / Feature Details */}
        {(mappings1 || mappings1Alt) && (
          <div className="flex flex-wrap gap-x-8 gap-y-2 pt-4 border-t border-[var(--color-primary)]/10 w-full">
            {mappings1 && (
              <span className="text-sm font-semibold text-[var(--color-primary)]">
                {mappings1}
              </span>
            )}
            {mappings1Alt && (
              <span className="text-sm text-[var(--color-primary)] opacity-50">
                {mappings1Alt}
              </span>
            )}
          </div>
        )}

        {/* Call to Action */}
        {cta_button && (
          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-[var(--color-background)] font-semibold rounded-full transition-transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            aria-label={cta_button}
          >
            {cta_button}
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
};

export default RichText;