import { Hero } from "./Hero";

export function BlockRenderer({ blocks }: { blocks: any[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.blockType === "Hero") {
          return <Hero key={i} data={block.data} />;
        }
        return <div key={i}>Unknown Block: {block.blockType}</div>;
      })}
    </>
  );
}
