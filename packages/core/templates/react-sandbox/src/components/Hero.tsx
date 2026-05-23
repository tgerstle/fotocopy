import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Hero Component
 * A high-impact UI block for Payload CMS.
 * Uses shadcn/ui primitives.
 */

interface HeroProps {
  title: string;
  description: string;
  cta_button: string;
}

export default function Hero({ title, description, cta_button }: HeroProps) {
  return (
    <section
      className="relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden py-20 px-6 bg-background"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <h1
          id="hero-title"
          className="text-4xl md:text-7xl font-extrabold tracking-tight text-primary mb-6"
        >
          {title}
        </h1>

        {description && (
          <p className="text-lg md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        )}

        {cta_button && (
          <div className="flex justify-center">
            <Button
              size="lg"
              className="rounded-full group px-8 text-lg"
              asChild
            >
              <a href="#" aria-label={cta_button}>
                {cta_button}
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
