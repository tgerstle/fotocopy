export function Hero({ data }: { data: any }) {
  // We natively read the W3C tokens passed through the payload!
  const primaryColor = data.designTokens?.color?.primary?.$value || "inherit";

  return (
    <section className="relative w-full py-24 flex flex-col items-center justify-center text-center">
      {/* Background Image could go here using next/image */}
      <div className="z-10 relative">
        <h1
          className="text-5xl font-bold mb-4"
          style={{ color: primaryColor }} // Natively applying the W3C DTCG Token!
        >
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="text-xl text-gray-600">{data.subtitle}</p>
        )}
      </div>
    </section>
  );
}
