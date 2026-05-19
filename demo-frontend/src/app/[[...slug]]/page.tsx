import { getPageData } from "@/lib/mockApi";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug ? params.slug.join("/") : "index";
  const pageData = await getPageData(slug);

  if (!pageData) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[--color-background]">
      <BlockRenderer blocks={pageData.layout} />
    </main>
  );
}
