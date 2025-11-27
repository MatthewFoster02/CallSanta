import Link from "next/link";
import { Snowfall, Footer } from "@/components/layout";

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#c41e3a]">
      <Snowfall />

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c41e3a] via-[#b01a33] to-[#8d142a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4a849] p-8 md:p-12 relative">
            {/* Top badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
                Safety & Privacy
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#c41e3a]/10 rounded-full mb-6 border border-[#d4a849]/60">
                <ShieldIcon className="w-12 h-12 text-[#c41e3a]" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-[#c41e3a] mb-4">
                How We Keep Calls Safe & Magical
              </h1>
              <p className="text-lg text-[#c41e3a]/80 max-w-2xl mx-auto">
                Your privacy and safety are our top priority. Here&apos;s how we protect your data and ensure a magical experience.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {/* Call Safety */}
              <div className="bg-white rounded-2xl p-6 border border-[#d4a849]/40 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#c41e3a]/10 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-[#c41e3a]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#c41e3a] mb-2">
                      Safe & Appropriate Conversations
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      Our AI Santa is specifically designed to be appropriate based on the age of the recipient and the provided details. Santa will only discuss appropriate topics like Christmas wishes, favorite toys, holiday traditions, and spreading joy. The conversation is guided to ensure a wholesome, magical experience for everyone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Collection */}
              <div className="bg-white rounded-2xl p-6 border border-[#d4a849]/40 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#c41e3a]/10 rounded-full flex items-center justify-center">
                    <EyeOffIcon className="w-6 h-6 text-[#c41e3a]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#c41e3a] mb-2">
                      Minimal Data Collection
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      We only collect the information necessary to make the call happen: the recipient&apos;s name, phone number, scheduled time, and your email for confirmation. We don&apos;t sell or share your personal information with third parties for marketing purposes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secure Storage */}
              <div className="bg-white rounded-2xl p-6 border border-[#d4a849]/40 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#c41e3a]/10 rounded-full flex items-center justify-center">
                    <LockIcon className="w-6 h-6 text-[#c41e3a]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#c41e3a] mb-2">
                      Encrypted & Secure
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      All data is encrypted in transit and at rest. We use industry-standard security practices and trusted providers (Stripe for payments, Supabase for data storage) to protect your information. Your payment details are never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recording Handling */}
              <div className="bg-white rounded-2xl p-6 border border-[#d4a849]/40 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#c41e3a]/10 rounded-full flex items-center justify-center">
                    <ServerIcon className="w-6 h-6 text-[#c41e3a]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#c41e3a] mb-2">
                      Recording Privacy
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      If you purchase a call recording, it is securely stored and only accessible to you via a private, time-limited download link. Recordings are automatically deleted from our servers after 48 hours. We do not listen to, review, or use recordings for any purpose other than providing them to you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Deletion */}
              <div className="bg-white rounded-2xl p-6 border border-[#d4a849]/40 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#c41e3a]/10 rounded-full flex items-center justify-center">
                    <TrashIcon className="w-6 h-6 text-[#c41e3a]" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#c41e3a] mb-2">
                      Data Deletion
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      You can request deletion of your data at any time by emailing us at{" "}
                      <a href="mailto:questions@santasnumber.com" className="text-[#c41e3a] hover:underline font-medium">
                        questions@santasnumber.com
                      </a>
                      . We will remove your information from our systems within 30 days of your request.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Contact Section */}
            <div className="mt-10 pt-8 border-t border-[#d4a849]/30 text-center">
              <h3 className="font-display text-lg font-semibold text-[#c41e3a] mb-3">
                Questions?
              </h3>
              <p className="text-gray-700">
                If you have any questions about our privacy practices or need assistance, please reach out to us at{" "}
                <a href="mailto:questions@santasnumber.com" className="text-[#c41e3a] hover:underline font-medium">
                  questions@santasnumber.com
                </a>
              </p>
            </div>

            <hr className="my-8 border-[#d4a849]/30" />

            <div className="text-center">
              <Link
                href="/"
                className="inline-block w-full max-w-xs border-2 border-[#d4a849]/60 hover:border-[#d4a849] text-[#c41e3a] font-semibold py-3 px-6 rounded-full transition-all duration-300 bg-white"
              >
                Back to Home
              </Link>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Last updated: November 2025
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

