import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Props derived directly from the consolidated schema shape.
 * Note: As per strict instructions, the interface is limited to the provided schema.
 */
interface CardGridProps {
  title: string;
  description: string;
  cta_button: string;
}

/**
 * CardGrid Component
 * A Server Component designed as a UI block for Payload CMS.
 * Uses shadcn/ui primitives.
 */
export default function CardGrid({
  title,
  description,
  cta_button,
}: CardGridProps) {
  return (
    <section
      className="py-16 px-6 flex justify-center items-center w-full"
      aria-labelledby="card-grid-heading"
    >
      <Card className="max-w-lg w-full transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle id="card-grid-heading" className="text-3xl text-primary">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        </CardContent>

        <CardFooter className="pt-2">
          <Button asChild variant="link" className="px-0 group">
            <Link
              href="#"
              className="inline-flex items-center gap-2"
              aria-label={cta_button}
            >
              {cta_button}
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
