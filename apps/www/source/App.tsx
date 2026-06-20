import { MainPreview, MdxPreview, OpenApiPreview } from '@clarify-labs/renderer/preview'

import { AnnouncementBadge } from './ui/elements/announcement-badge'
import { ButtonLink, PlainButtonLink } from './ui/elements/button'
import { Main } from './ui/elements/main'
import { Screenshot } from './ui/elements/screenshot'
import { ArrowNarrowRightIcon } from './ui/icons/arrow-narrow-right-icon'
import { ChevronIcon } from './ui/icons/chevron-icon'
import { GitHubIcon } from './ui/icons/social/github-icon'
import { XIcon } from './ui/icons/social/x-icon'
import { YouTubeIcon } from './ui/icons/social/youtube-icon'
import { ClarifyLogo } from './ui/Logo'
import { CallToActionSimple } from './ui/sections/call-to-action-simple'
import { CallToActionSimpleCentered } from './ui/sections/call-to-action-simple-centered'
import { FAQsTwoColumnAccordion, Faq } from './ui/sections/faqs-two-column-accordion'
import { FeatureWithDemo, FeaturesTwoColumnWithDemos } from './ui/sections/features-two-column-with-demos'
import {
  FooterCategory,
  FooterLink,
  FooterWithNewsletterFormCategoriesAndSocialIcons,
  NewsletterForm,
  SocialLink,
} from './ui/sections/footer-with-newsletter-form-categories-and-social-icons'
import { HeroLeftAlignedWithDemo } from './ui/sections/hero-left-aligned-with-demo'
import {
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from './ui/sections/navbar-with-links-actions-and-centered-logo'
import { PlanComparisonTable } from './ui/sections/plan-comparison-table'
import { Plan, PricingMultiTier } from './ui/sections/pricing-multi-tier'
import { Stat, StatsFourColumns } from './ui/sections/stats-four-columns'
import { Testimonial, TestimonialThreeColumnGrid } from './ui/sections/testimonials-three-column-grid'
import {
  comparisonFeatures,
  faqs,
  finalCta,
  hero,
  navLinks,
  pricingPlans,
  primaryCta,
  site,
  stats,
  workflow,
} from './content'

export default function App({ path = window.location.pathname }: { path?: string }) {
  const normalizedPath = normalizePath(path)

  return (
    <>
      <Navbar />
      <Main>{renderRoute(normalizedPath)}</Main>
      <Footer />
    </>
  )
}

function normalizePath(path: string) {
  if (path === '/404.html') {
    return '/404.html'
  }

  return path.endsWith('/') ? path : `${path}/`
}

function renderRoute(path: string) {
  if (path === '/pricing/') {
    return <PricingPage />
  }

  if (path === '/about/') {
    return <AboutPage />
  }

  if (path === '/privacy-policy/') {
    return <PrivacyPolicyPage />
  }

  if (path === '/404.html') {
    return <NotFoundPage />
  }

  return <HomePage />
}

function Navbar() {
  return (
    <NavbarWithLinksActionsAndCenteredLogo
      id="navbar"
      links={
        <>
          {navLinks.map((link) => (
            <NavbarLink key={link.href} href={link.href}>
              {link.label}
            </NavbarLink>
          ))}
        </>
      }
      logo={
        <NavbarLogo href="/">
          <ClarifyLogo />
        </NavbarLogo>
      }
      actions={
        <>
          <PlainButtonLink href={site.githubUrl}>
            GitHub
          </PlainButtonLink>
          <ButtonLink href={site.docsUrl}>Get started</ButtonLink>
        </>
      }
    />
  )
}

function Footer() {
  return (
    <FooterWithNewsletterFormCategoriesAndSocialIcons
      id="footer"
      cta={
        <NewsletterForm
          headline="Stay close to Clarify"
          subheadline={<p>Get product notes, release updates, and implementation tips from Taicode Labs.</p>}
          action={site.contactUrl}
        />
      }
      links={
        <>
          <FooterCategory title="Product">
            <FooterLink href="/#features">Features</FooterLink>
            <FooterLink href="/pricing/">Pricing</FooterLink>
            <FooterLink href={site.docsUrl}>Documentation</FooterLink>
          </FooterCategory>
          <FooterCategory title="Company">
            <FooterLink href="/about/">About</FooterLink>
            <FooterLink href={site.contactUrl}>Contact</FooterLink>
            <FooterLink href={site.githubUrl}>GitHub</FooterLink>
          </FooterCategory>
          <FooterCategory title="Resources">
            <FooterLink href={`${site.docsUrl}/getting-started`}>Getting started</FooterLink>
            <FooterLink href={`${site.docsUrl}/guides`}>Guides</FooterLink>
            <FooterLink href={`${site.docsUrl}/api`}>API Reference</FooterLink>
          </FooterCategory>
          <FooterCategory title="Legal">
            <FooterLink href="/privacy-policy/">Privacy Policy</FooterLink>
            <FooterLink href="/pricing/">Commercial Services</FooterLink>
          </FooterCategory>
        </>
      }
      fineprint="AGPL-3.0-only © 2026 Taicode Labs"
      socialLinks={
        <>
          <SocialLink href="https://x.com/taicode" name="X">
            <XIcon />
          </SocialLink>
          <SocialLink href={site.githubUrl} name="GitHub">
            <GitHubIcon />
          </SocialLink>
          <SocialLink href="https://www.youtube.com" name="YouTube">
            <YouTubeIcon />
          </SocialLink>
        </>
      }
    />
  )
}

function HomePage() {
  return (
    <>
      <HeroLeftAlignedWithDemo
        id="hero"
        eyebrow={<AnnouncementBadge href="/#workflow" text={hero.badge} cta={hero.badgeCta} />}
        headline={hero.headline}
        subheadline={<p>{hero.subheadline}</p>}
        cta={primaryCta()}
        demo={<ProductDemo />}
      />

      <StatsFourColumns
        id="stats"
        eyebrow="Built for static publishing"
        headline="A documentation pipeline that stays simple."
        subheadline={<p>Clarify keeps authoring flexible while preserving static deployment as the production default.</p>}
      >
        {stats.map((item) => (
          <Stat key={item.stat} stat={item.stat} text={item.text} />
        ))}
      </StatsFourColumns>

      <PowerfulFeaturesSection />

      <WorkflowSection />

      <TestimonialsSection />

      <PricingMultiTier
        id="pricing-preview"
        eyebrow="Pricing"
        headline="Free core, optional delivery partnership."
        subheadline={<p>Use Clarify freely, then work with Taicode Labs when you need migration, customization, and launch support.</p>}
        cta={
          <PlainButtonLink href="/pricing/" size="lg">
            Compare plans <ArrowNarrowRightIcon />
          </PlainButtonLink>
        }
        plans={
          <>
            {pricingPlans.map((plan) => (
              <Plan key={plan.name} {...plan} subheadline={<p>{plan.subheadline}</p>} />
            ))}
          </>
        }
      />

      <FAQs />

      <CallToActionSimpleCentered
        id="call-to-action"
        headline="Launch clearer docs without starting from a blank page."
        subheadline={<p>Start with the open-source tool or ask Taicode Labs to migrate and launch your production documentation site.</p>}
        cta={finalCta()}
      />
    </>
  )
}

function PowerfulFeaturesSection() {
  return (
    <FeaturesTwoColumnWithDemos
      id="features"
      eyebrow="Powerful features"
      headline="Everything you need to publish polished developer documentation."
      subheadline={<p>Keep the template's strongest visual module, but use it to show Clarify's MDX authoring, OpenAPI rendering, and static publishing workflow.</p>}
      features={
        <>
          <FeatureWithDemo
            demo={
              <Screenshot className="h-full" wallpaper="purple" placement="bottom-right">
                <MdxPreview />
              </Screenshot>
            }
            headline="MDX content that feels like product UI"
            subheadline={<p>Author guides as files, embed React components, and keep docs close to the code they explain.</p>}
            cta={<PlainButtonLink className="px-0 hover:bg-transparent" href={site.docsUrl}>Explore authoring <ArrowNarrowRightIcon /></PlainButtonLink>}
          />
          <FeatureWithDemo
            demo={
              <Screenshot className="h-full" wallpaper="blue" placement="bottom-left">
                <OpenApiPreview />
              </Screenshot>
            }
            headline="OpenAPI references and static deployment"
            subheadline={<p>Generate readable endpoint pages from schemas, then ship pure static HTML, CSS, and JavaScript with Vite SSG.</p>}
            cta={<PlainButtonLink className="px-0 hover:bg-transparent" href={`${site.docsUrl}/api`}>View API docs <ArrowNarrowRightIcon /></PlainButtonLink>}
          />
        </>
      }
    />
  )
}

function TestimonialsSection() {
  const testimonials = [
    ['Clarify helped us turn scattered Markdown and OpenAPI files into a documentation site that finally feels intentional.', 'Maya Chen', 'Developer Experience Lead'],
    ['The static output model made deployment boring in the best way. We pushed it to our CDN and stopped worrying about runtime infrastructure.', 'Ethan Brooks', 'Platform Engineer'],
    ['Taicode Labs kept the migration pragmatic: preserve what worked, clean up the navigation, and ship the first version quickly.', 'Nora Kim', 'Product Lead'],
    ['The renderer components gave our docs the polish of a product surface without forcing the engineering team into a full redesign.', 'Leo Martin', 'Engineering Manager'],
    ['OpenAPI pages no longer feel bolted on. They sit next to guides, examples, and release notes in one coherent experience.', 'Ava Patel', 'API Program Manager'],
    ['We started free, then brought in Delivery Partner support when deadlines got tight. That path made adoption much easier.', 'Sam Rivera', 'Founder'],
  ]

  return (
    <TestimonialThreeColumnGrid
      id="testimonial"
      headline="What our customers are saying"
      subheadline={<p>Teams use Clarify to move quickly from raw docs content to a polished, static documentation site.</p>}
    >
      {testimonials.map(([quote, name, byline], index) => (
        <Testimonial
          key={name}
          quote={<p>{quote}</p>}
          img={<img src={`/img/avatars/${index + 10}-size-160.webp`} alt="" className="bg-white/75 dark:bg-black/75" width={160} height={160} />}
          name={name}
          byline={byline}
        />
      ))}
    </TestimonialThreeColumnGrid>
  )
}

function ProductDemo() {
  return (
    <Screenshot className="rounded-lg" wallpaper="blue" placement="bottom">
      <MainPreview />
    </Screenshot>
  )
}

function WorkflowSection() {
  return (
    <CallToActionSimple
      id="workflow"
      eyebrow="Workflow"
      headline="From source files to deployable static output."
      subheadline={<p>Clarify keeps the authoring flow understandable: write, configure, build, and ship.</p>}
      cta={
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          {workflow.map((step) => (
            <div key={step.label} className="rounded-xl bg-mist-950/2.5 p-6 dark:bg-white/5">
              <div className="text-sm/7 font-semibold text-mist-500">{step.label}</div>
              <h3 className="mt-2 text-xl/8 text-mist-950 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm/7 text-mist-700 dark:text-mist-400">{step.text}</p>
            </div>
          ))}
        </div>
      }
    />
  )
}

function PricingPage() {
  return (
    <>
      <PricingMultiTier
        id="pricing"
        eyebrow="Pricing"
        headline="Free when you self-host, custom when we deliver."
        subheadline={<p>Clarify has no fixed paid tier. The product stays free to use; commercial work is scoped as a Delivery Partner engagement.</p>}
        plans={
          <>
            {pricingPlans.map((plan) => (
              <Plan key={plan.name} {...plan} subheadline={<p>{plan.subheadline}</p>} />
            ))}
          </>
        }
      />
      <PlanComparisonTable plans={['Free', 'Delivery Partner']} features={comparisonFeatures} />
      <FAQs />
      <CallToActionSimpleCentered
        headline="Need a documentation partner?"
        subheadline={<p>Taicode Labs can help migrate content, tune the visual system, and prepare a static deployment pipeline.</p>}
        cta={
          <ButtonLink href={site.contactUrl} size="lg">
            Talk to Delivery Partner services
          </ButtonLink>
        }
      />
    </>
  )
}

function AboutPage() {
  return (
    <>
      <CallToActionSimple
        id="about"
        eyebrow="About Clarify"
        headline="An open-source documentation publishing tool from Taicode Labs."
        subheadline={<p>Clarify exists to make developer documentation easier to own: static by default, content-driven, API-aware, and friendly to React teams.</p>}
        cta={
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href={site.docsUrl} size="lg">Read the docs</ButtonLink>
            <PlainButtonLink href={site.githubUrl} size="lg">Explore source <ChevronIcon /></PlainButtonLink>
          </div>
        }
      />
      <StatsFourColumns headline="What we optimize for" subheadline={<p>Practical documentation infrastructure for small teams that need credible output quickly.</p>}>
        <Stat stat="Open" text="Transparent source, clear licensing, and a community-friendly starting point." />
        <Stat stat="Static" text="No runtime server requirement for public documentation deployments." />
        <Stat stat="Typed" text="TypeScript packages for CLI, renderer, and app integration." />
        <Stat stat="Service" text="Commercial help is available when timelines are tight." />
      </StatsFourColumns>
    </>
  )
}

function PrivacyPolicyPage() {
  return (
    <CallToActionSimple
      id="privacy"
      eyebrow="Privacy"
      headline="Privacy Policy"
      subheadline={<p>Clarify's marketing site is a static website. If you contact Taicode Labs, the information you provide is used to respond to your request and deliver the requested service.</p>}
      cta={<PlainButtonLink href={site.contactUrl}>Contact us <ChevronIcon /></PlainButtonLink>}
    />
  )
}

function NotFoundPage() {
  return (
    <CallToActionSimpleCentered
      headline="Page not found"
      subheadline={<p>The page you are looking for does not exist or has moved.</p>}
      cta={<ButtonLink href="/">Back home</ButtonLink>}
    />
  )
}

function FAQs() {
  return (
    <FAQsTwoColumnAccordion
      id="faqs"
      headline="Questions teams ask before adopting Clarify."
      subheadline={<p>Clarify is designed to start simple and scale into a complete developer documentation workflow.</p>}
    >
      {faqs.map((faq) => (
        <Faq key={faq.question} question={faq.question} answer={<p>{faq.answer}</p>} />
      ))}
    </FAQsTwoColumnAccordion>
  )
}
