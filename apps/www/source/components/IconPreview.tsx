import { useTranslation } from 'react-i18next'

const iconOptions = [
  {
    nameKey: 'iconPreview.bookM.name',
    descriptionKey: 'iconPreview.bookM.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Book M icon">
        <rect width="64" height="64" rx="18" fill="#064e3b" />
        <path d="M18 47V17l14 14 14-14v30" fill="none" stroke="#ecfdf5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
        <path d="M18 47c5.6-3.1 10.3-3.1 14 0 3.7-3.1 8.4-3.1 14 0" fill="none" stroke="#6ee7b7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <path d="M32 31v16" stroke="#10b981" strokeLinecap="round" strokeWidth="3.5" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.boldBookM.name',
    descriptionKey: 'iconPreview.boldBookM.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Bold Book M icon">
        <rect width="64" height="64" rx="18" fill="#022c22" />
        <path d="M17 48V16" stroke="#ecfdf5" strokeLinecap="round" strokeWidth="10" />
        <path d="M47 48V16" stroke="#ecfdf5" strokeLinecap="round" strokeWidth="10" />
        <path d="M17 17 32 35 47 17" fill="none" stroke="#86efac" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" />
        <path d="M22 47c4-2 7-2 10 0 3-2 6-2 10 0" fill="none" stroke="#34d399" strokeLinecap="round" strokeWidth="4" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.pageM.name',
    descriptionKey: 'iconPreview.pageM.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Page M icon">
        <rect width="64" height="64" rx="18" fill="#059669" />
        <path d="M15 18c7 0 12 2 17 7 5-5 10-7 17-7v29c-7 0-12 1.7-17 6-5-4.3-10-6-17-6V18Z" fill="#ecfdf5" />
        <path d="M20 42V24l12 12 12-12v18" fill="none" stroke="#047857" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        <path d="M32 25v27" stroke="#10b981" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.mLeaf.name',
    descriptionKey: 'iconPreview.mLeaf.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="M Leaf icon">
        <rect width="64" height="64" rx="18" fill="#14532d" />
        <path d="M17 47V18l15 17 15-17v29" fill="none" stroke="#dcfce7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
        <path d="M44 20c-7.5.6-11.5 5.1-10.9 11.8 6.6.7 11.3-3.5 10.9-11.8Z" fill="#4ade80" />
        <path d="M35.5 30c2-2.7 4.1-4.2 6.8-5.4" stroke="#064e3b" strokeLinecap="round" strokeWidth="2.8" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.clearLeaf.name',
    descriptionKey: 'iconPreview.clearLeaf.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Clear Leaf icon">
        <rect width="64" height="64" rx="18" fill="#052e16" />
        <path
          d="M45.5 16.5C31.5 16.9 21 25.3 20.7 37.7c-.1 5.7 4.3 10.4 10 10.5 12.2.3 20.7-10.4 21.1-24.4.1-4-2.3-7.4-6.3-7.3Z"
          fill="#34d399"
        />
        <path
          d="M22 43c6.4-7.6 13.2-12.2 22-15"
          fill="none"
          stroke="#ecfdf5"
          strokeLinecap="round"
          strokeWidth="4.5"
        />
        <path
          d="M25 33.5h12.5"
          fill="none"
          stroke="#064e3b"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.foldedDoc.name',
    descriptionKey: 'iconPreview.foldedDoc.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Folded Doc icon">
        <rect width="64" height="64" rx="16" fill="#059669" />
        <path d="M19 13h19l9 9v29H19V13Z" fill="#ecfdf5" />
        <path d="M38 13v10h9" fill="#a7f3d0" />
        <path
          d="M26 32h13M26 39h9"
          fill="none"
          stroke="#047857"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
        <path
          d="M22 50 47 25"
          fill="none"
          stroke="#10b981"
          strokeLinecap="round"
          strokeWidth="5"
        />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.clarifyC.name',
    descriptionKey: 'iconPreview.clarifyC.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Clarify C icon">
        <rect width="64" height="64" rx="20" fill="#022c22" />
        <path
          d="M43 20.5A17 17 0 1 0 43 43.5"
          fill="none"
          stroke="#6ee7b7"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path
          d="M30 27h17M30 37h13"
          fill="none"
          stroke="#f0fdf4"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.sparkPage.name',
    descriptionKey: 'iconPreview.sparkPage.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Spark Page icon">
        <rect width="64" height="64" rx="18" fill="#16a34a" />
        <path d="M18 14h28v36H18z" fill="#f0fdf4" />
        <path d="M25 25h14M25 33h11M25 41h8" stroke="#15803d" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M47 17l2.2 5.8L55 25l-5.8 2.2L47 33l-2.2-5.8L39 25l5.8-2.2L47 17Z" fill="#bbf7d0" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.openBook.name',
    descriptionKey: 'iconPreview.openBook.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Open Book icon">
        <rect width="64" height="64" rx="17" fill="#065f46" />
        <path d="M13 18c7.2 0 13.2 1.6 19 5.2V49c-5.8-3.6-11.8-5.2-19-5.2V18Z" fill="#d1fae5" />
        <path d="M32 23.2C37.8 19.6 43.8 18 51 18v25.8c-7.2 0-13.2 1.6-19 5.2V23.2Z" fill="#ecfdf5" />
        <path d="M21 28h6M21 35h6M38 28h7M38 35h7" stroke="#047857" strokeLinecap="round" strokeWidth="3" />
        <path d="M32 24v24" stroke="#10b981" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.focusRing.name',
    descriptionKey: 'iconPreview.focusRing.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Focus Ring icon">
        <rect width="64" height="64" rx="18" fill="#064e3b" />
        <circle cx="32" cy="32" r="17" fill="none" stroke="#34d399" strokeWidth="5" />
        <path d="M18 32h28" stroke="#ecfdf5" strokeLinecap="round" strokeWidth="4" />
        <circle cx="47" cy="32" r="5" fill="#a7f3d0" />
        <path d="M25 24h14M25 40h10" stroke="#6ee7b7" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.terminalLeaf.name',
    descriptionKey: 'iconPreview.terminalLeaf.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Terminal Leaf icon">
        <rect width="64" height="64" rx="18" fill="#022c22" />
        <rect x="14" y="17" width="36" height="30" rx="7" fill="#ecfdf5" />
        <path d="m22 28 5 4-5 4" fill="none" stroke="#047857" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
        <path d="M32 37h8" stroke="#10b981" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M42 18c-6.8 1-10.6 5.1-10.2 10.4 5.2.6 9.6-3.2 10.2-10.4Z" fill="#34d399" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.docCompass.name',
    descriptionKey: 'iconPreview.docCompass.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Doc Compass icon">
        <rect width="64" height="64" rx="19" fill="#047857" />
        <circle cx="32" cy="32" r="19" fill="#d1fae5" />
        <path d="M40 21 35.5 36.5 20 43l6.5-15.5L40 21Z" fill="#10b981" />
        <circle cx="32" cy="32" r="4" fill="#064e3b" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.layeredPages.name',
    descriptionKey: 'iconPreview.layeredPages.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Layered Pages icon">
        <rect width="64" height="64" rx="18" fill="#065f46" />
        <rect x="17" y="14" width="29" height="36" rx="4" fill="#6ee7b7" />
        <rect x="22" y="19" width="25" height="31" rx="4" fill="#ecfdf5" />
        <path d="M28 29h13M28 36h10" stroke="#047857" strokeLinecap="round" strokeWidth="3.2" />
        <path d="M17 23h8" stroke="#d1fae5" strokeLinecap="round" strokeWidth="3.2" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.mdxMark.name',
    descriptionKey: 'iconPreview.mdxMark.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="MDX Mark icon">
        <rect width="64" height="64" rx="16" fill="#10b981" />
        <path d="m25 24-9 8 9 8M39 24l9 8-9 8" fill="none" stroke="#ecfdf5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5" />
        <path d="M29 43h11" stroke="#064e3b" strokeLinecap="round" strokeWidth="4" />
        <path d="M31 20h8" stroke="#bbf7d0" strokeLinecap="round" strokeWidth="4" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.apiNode.name',
    descriptionKey: 'iconPreview.apiNode.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="API Node icon">
        <rect width="64" height="64" rx="18" fill="#064e3b" />
        <path d="M23 32h18M32 23v18" stroke="#a7f3d0" strokeLinecap="round" strokeWidth="4" />
        <circle cx="23" cy="32" r="7" fill="#ecfdf5" />
        <circle cx="41" cy="32" r="7" fill="#34d399" />
        <circle cx="32" cy="23" r="6" fill="#6ee7b7" />
        <circle cx="32" cy="41" r="6" fill="#10b981" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.lightBeam.name',
    descriptionKey: 'iconPreview.lightBeam.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Light Beam icon">
        <rect width="64" height="64" rx="18" fill="#052e16" />
        <path d="M19 14h26v36H19z" fill="#dcfce7" />
        <path d="M16 37 49 24v14L16 51V37Z" fill="#22c55e" />
        <path d="M25 23h13M25 31h8" stroke="#047857" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.seedGlyph.name',
    descriptionKey: 'iconPreview.seedGlyph.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Seed Glyph icon">
        <rect width="64" height="64" rx="20" fill="#14532d" />
        <path d="M32 48C22 40 20 26 32 16c12 10 10 24 0 32Z" fill="#86efac" />
        <path d="M32 17v31" stroke="#052e16" strokeLinecap="round" strokeWidth="3.5" />
        <path d="M32 32c5.7-1.2 9.4-4 12-9M32 39c-5.2-1-8.8-3.5-12-8" stroke="#ecfdf5" strokeLinecap="round" strokeWidth="3.5" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.checkPages.name',
    descriptionKey: 'iconPreview.checkPages.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Check Pages icon">
        <rect width="64" height="64" rx="17" fill="#059669" />
        <rect x="16" y="15" width="28" height="34" rx="5" fill="#ecfdf5" />
        <path d="M23 25h13M23 32h10" stroke="#047857" strokeLinecap="round" strokeWidth="3.2" />
        <circle cx="43" cy="42" r="11" fill="#064e3b" />
        <path d="m37.5 42 3.7 3.7 7.2-8" fill="none" stroke="#bbf7d0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.routeLine.name',
    descriptionKey: 'iconPreview.routeLine.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Route Line icon">
        <rect width="64" height="64" rx="18" fill="#022c22" />
        <path d="M19 21h26v22H19z" fill="#d1fae5" />
        <path d="M24 29h13M24 36h9" stroke="#047857" strokeLinecap="round" strokeWidth="3" />
        <path d="M18 49c9-1 11-8 19-8 5.4 0 7.6 3.1 11 3.1" fill="none" stroke="#34d399" strokeLinecap="round" strokeWidth="4.5" />
        <circle cx="49" cy="44" r="4" fill="#ecfdf5" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.bracketLeaf.name',
    descriptionKey: 'iconPreview.bracketLeaf.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Bracket Leaf icon">
        <rect width="64" height="64" rx="18" fill="#047857" />
        <path d="M25 19H16v26h9M39 19h9v26h-9" fill="none" stroke="#ecfdf5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <path d="M39 25c-8.4.6-13.1 5.8-12.2 13 8 .8 13.1-4.2 12.2-13Z" fill="#a7f3d0" />
        <path d="M29 36c2.6-3.5 5.1-5.4 8.5-7" stroke="#065f46" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.prismDoc.name',
    descriptionKey: 'iconPreview.prismDoc.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Prism Doc icon">
        <rect width="64" height="64" rx="18" fill="#064e3b" />
        <path d="M18 16h28v34H18z" fill="#ecfdf5" />
        <path d="M46 16 30 50h16V16Z" fill="#6ee7b7" />
        <path d="M25 26h13M25 34h9" stroke="#047857" strokeLinecap="round" strokeWidth="3.2" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.flowC.name',
    descriptionKey: 'iconPreview.flowC.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Flow C icon">
        <rect width="64" height="64" rx="20" fill="#052e16" />
        <path d="M44 20c-4-3-10.3-4-16.1-1.5C20.2 21.8 16.6 30.8 20 38.6c3.3 7.7 12.1 11.4 19.9 8.2" fill="none" stroke="#a7f3d0" strokeLinecap="round" strokeWidth="5.5" />
        <path d="M27 30h18M27 38h13" stroke="#34d399" strokeLinecap="round" strokeWidth="4" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.paperPlane.name',
    descriptionKey: 'iconPreview.paperPlane.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Paper Plane icon">
        <rect width="64" height="64" rx="18" fill="#059669" />
        <path d="M14 31 50 15 38 50l-7-15-17-4Z" fill="#ecfdf5" />
        <path d="M31 35 50 15" stroke="#047857" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
        <path d="M24 43h9" stroke="#bbf7d0" strokeLinecap="round" strokeWidth="4" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.boltPage.name',
    descriptionKey: 'iconPreview.boltPage.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Bolt Page icon">
        <rect width="64" height="64" rx="17" fill="#022c22" />
        <path d="M20 13h25v38H20z" fill="#d1fae5" />
        <path d="M37 18 25 35h9l-5 13 13-18h-9l4-12Z" fill="#10b981" />
        <path d="M25 23h7" stroke="#047857" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.searchDoc.name',
    descriptionKey: 'iconPreview.searchDoc.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Search Doc icon">
        <rect width="64" height="64" rx="18" fill="#047857" />
        <rect x="17" y="14" width="27" height="34" rx="5" fill="#ecfdf5" />
        <path d="M24 25h12M24 32h8" stroke="#059669" strokeLinecap="round" strokeWidth="3" />
        <circle cx="40" cy="40" r="8" fill="none" stroke="#064e3b" strokeWidth="4" />
        <path d="m46 46 5 5" stroke="#064e3b" strokeLinecap="round" strokeWidth="4" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.gridLeaf.name',
    descriptionKey: 'iconPreview.gridLeaf.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Grid Leaf icon">
        <rect width="64" height="64" rx="18" fill="#14532d" />
        <rect x="16" y="16" width="13" height="13" rx="4" fill="#bbf7d0" />
        <rect x="35" y="16" width="13" height="13" rx="4" fill="#86efac" />
        <rect x="16" y="35" width="13" height="13" rx="4" fill="#4ade80" />
        <path d="M48 35c-8.5.3-13.2 5.1-12.8 12.9 7.6.5 12.8-4.5 12.8-12.9Z" fill="#ecfdf5" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.bookSpark.name',
    descriptionKey: 'iconPreview.bookSpark.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Book Spark icon">
        <rect width="64" height="64" rx="18" fill="#065f46" />
        <path d="M18 18h14v30H18c-2.2 0-4-1.8-4-4V22c0-2.2 1.8-4 4-4Z" fill="#d1fae5" />
        <path d="M32 18h14c2.2 0 4 1.8 4 4v22c0 2.2-1.8 4-4 4H32V18Z" fill="#ecfdf5" />
        <path d="M43 20 45 25l5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#22c55e" />
        <path d="M22 29h5M22 36h5" stroke="#047857" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.apiBraces.name',
    descriptionKey: 'iconPreview.apiBraces.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="API Braces icon">
        <rect width="64" height="64" rx="18" fill="#064e3b" />
        <path d="M25 18c-5 0-7 3-7 7v4c0 2-1.2 3-3 3 1.8 0 3 1 3 3v4c0 4 2 7 7 7M39 18c5 0 7 3 7 7v4c0 2 1.2 3 3 3-1.8 0-3 1-3 3v4c0 4-2 7-7 7" fill="none" stroke="#a7f3d0" strokeLinecap="round" strokeWidth="4" />
        <path d="M28 28h8M28 36h8" stroke="#ecfdf5" strokeLinecap="round" strokeWidth="3.5" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.clearStack.name',
    descriptionKey: 'iconPreview.clearStack.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Clear Stack icon">
        <rect width="64" height="64" rx="19" fill="#10b981" />
        <path d="M32 14 50 24 32 34 14 24 32 14Z" fill="#ecfdf5" />
        <path d="m17 32 15 8 15-8M17 40l15 8 15-8" fill="none" stroke="#064e3b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
        <path d="M26 24h12" stroke="#059669" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    nameKey: 'iconPreview.orbitDoc.name',
    descriptionKey: 'iconPreview.orbitDoc.description',
    svg: (
      <svg viewBox="0 0 64 64" role="img" aria-label="Orbit Doc icon">
        <rect width="64" height="64" rx="18" fill="#022c22" />
        <rect x="24" y="18" width="22" height="30" rx="5" fill="#ecfdf5" />
        <path d="M29 28h11M29 35h8" stroke="#047857" strokeLinecap="round" strokeWidth="3" />
        <path d="M14 37c8 11 28 11 36-1" fill="none" stroke="#34d399" strokeLinecap="round" strokeWidth="4" />
        <circle cx="17" cy="38" r="4" fill="#a7f3d0" />
      </svg>
    ),
  },
]

export function IconPreview() {
  const { t } = useTranslation()

  return (
    <section id="icon-preview" className="border-y border-emerald-200/70 bg-emerald-50/70 py-24 dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">{t('iconPreview.eyebrow')}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">{t('iconPreview.title')}</h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">{t('iconPreview.description')}</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {iconOptions.map((option) => (
            <article key={option.nameKey} className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm shadow-emerald-900/5 dark:border-emerald-900/70 dark:bg-zinc-900">
              <div className="flex items-center gap-5">
                <div className="size-20 shrink-0 overflow-hidden rounded-3xl shadow-lg shadow-emerald-900/15">{option.svg}</div>
                <div>
                  <h3 className="font-semibold text-zinc-950 dark:text-white">{t(option.nameKey)}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t(option.descriptionKey)}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center rounded-2xl bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%),linear-gradient(-45deg,#f4f4f5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f4f4f5_75%),linear-gradient(-45deg,transparent_75%,#f4f4f5_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px] p-8 dark:bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)]">
                <div className="size-32">{option.svg}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
