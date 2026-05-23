import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Props derived directly from the consolidated schema shape.
 */
interface HeroProps {
  title: string;
  description: string;
  cta_button: string;
}

/**
 * Hero Component
 * 
 * A high-impact Server Component designed for Payload CMS.
 * Uses W3C Design Tokens via CSS variables for full themeability.
 */
export default function Hero({ title, description, cta_button }: HeroProps) {
  // Placeholder image for demonstration as the interface does not provide a backgroundImage prop.
  // In a production environment, this would ideally be passed via props or a global setting.
  const backgroundImageUrl = "https://images.unsplash.com/photo-1557683316-d57621331748?q=80&w=2070";

  return (
    <section 
      className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImageUrl}
          alt="" // Decorative background image
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Overlay to ensure text readability using design tokens */}
        <div 
          className="absolute inset-0 bg-[var(--color-bluedark)]/60" 
          aria-hidden="true" 
        />
      </div>

      {/* Content Container */}
      <div 
        className="relative z-10 w-[calc(100%-40px)] max-w-[calc(100%-20px)] mx-auto px-4 py-20 text-center"
      >
        <div className="flex flex-col items-center max-w-3xl mx-auto">
          
          {/* Title */}
          <h1 
            id="hero-title"
            className="text-[var(--color-white)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            {title}
          </h1>

          {/* Description - Only renders if string is not empty */}
          {description && (
            <p className="text-[var(--color-light-accent)] text-lg md:text-xl mb-10 leading-relaxed">
              {description}
            </p>
          )}

          {/* Call to Action */}
          {cta_button && (
            <Link
              href="#cta"
              className="group inline-flex items-center gap-2 bg-[var(--color-main)] text-[var(--color-black)] px-8 py-4 rounded-md font-bold text-lg transition-all hover:scale-105 active:scale-95"
              aria-label={cta_button}
            >
              {cta_button}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          
        </div>
      </div>
    </section>
  );
}