export default function App() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-32 top-[-8rem] h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-6rem] h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
        <p className="mb-6 inline-block rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs tracking-[0.2em] text-cyan-200">
          CLARIFY OSS
        </p>
        <h1 className="max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
          Publish docs where MDX, React, and OpenAPI finally feel native together.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Build developer docs with composable content blocks, typed API references, and fast Vite-powered previews.
        </p>
      </section>
    </main>
  );
}
