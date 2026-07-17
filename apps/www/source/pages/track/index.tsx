import { CallToActionSimple } from '../../components/sections/call-to-action-simple'
import { createMeta } from '../../utils/seo'

export const meta = () => createMeta(
  'Thank you for using Clarify',
  'A note of thanks to everyone building and publishing documentation with Clarify.',
  '/api/track',
)

// BuiltWithClarify loads this route in a hidden iframe so clarify.pub can use
// the HTTP referrer to understand which sites use Clarify. Direct visits show
// this thank-you note instead of an empty tracking response.
export default function TrackPage() {
  return (
    <CallToActionSimple
      id="thank-you"
      eyebrow="A note from the Clarify team"
      headline="Thank you for using Clarify."
      subheadline={
        <div className="space-y-4">
          <p>
            Every guide you publish, API you document, and question you help someone answer gives this project a reason to keep improving.
          </p>
          <p>
            We are grateful that you chose Clarify to be part of your work. Thank you for building with us and for helping make good documentation easier to own, share, and trust.
          </p>
          <p>With appreciation,<br />The Clarify team</p>
        </div>
      }
    />
  )
}
