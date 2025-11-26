'use client';

import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookingFormData, bookingSchema } from '@/lib/schemas/booking';
import { Input, Button, Card } from '@/components/ui';
import { PhoneInput } from './PhoneInput';
import { DateTimePicker } from './DateTimePicker';
import { VoiceRecorder } from './VoiceRecorder';
import { parsePhoneNumber } from 'react-phone-number-input';
import {
  Check,
  ChevronLeft,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

type BookingResult = {
  callId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
};

type PricingInfo = {
  basePrice: number;
  recordingPrice?: number;
};

interface BookingWizardProps {
  onSubmit: (data: BookingFormData, voiceFile: File | null) => Promise<BookingResult>;
  pricing: PricingInfo;
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function BookingWizard({ onSubmit, pricing }: BookingWizardProps) {
  const [formData, setFormData] = useState<BookingFormData | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [expressReady, setExpressReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);

  const handleFormSubmit = async (values: BookingFormData) => {
    setIsSubmitting(true);
    setFlowError(null);
    try {
      const normalized = { ...values, purchaseRecording: values.purchaseRecording ?? false };
      const result = await onSubmit(normalized, voiceFile);
      setFormData(normalized);
      setBookingResult(result);
    } catch (error) {
      console.error('Booking creation failed:', error);
      setFlowError(error instanceof Error ? error.message : 'Unable to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setFormData(null);
    setBookingResult(null);
    setFlowError(null);
    setExpressReady(false);
    setVoiceFile(null);
  };

  const handleCheckoutRedirect = () => {
    if (!bookingResult) return;
    setFlowError(null);
    setIsSubmitting(true);
    window.location.href = bookingResult.checkoutUrl;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {!formData || !bookingResult ? (
        <BookingForm
          onSubmit={handleFormSubmit}
          pricing={pricing}
          isSubmitting={isSubmitting}
          errorMessage={flowError}
          onVoiceChange={setVoiceFile}
        />
      ) : (
        <BookingReview
          data={formData}
          bookingResult={bookingResult}
          pricing={pricing}
          onEdit={handleEdit}
          flowError={flowError}
          setFlowError={setFlowError}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          expressReady={expressReady}
          setExpressReady={setExpressReady}
          onCheckout={handleCheckoutRedirect}
          hasVoiceNote={!!voiceFile}
        />
      )}
    </div>
  );
}

function BookingForm({
  onSubmit,
  pricing,
  isSubmitting,
  errorMessage,
  onVoiceChange,
}: {
  onSubmit: (data: BookingFormData) => Promise<void>;
  pricing: PricingInfo;
  isSubmitting: boolean;
  errorMessage: string | null;
  onVoiceChange: (file: File | null) => void;
}) {
  const [showVoice, setShowVoice] = useState(false);
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      childName: '',
      childAge: undefined,
      childInfoText: '',
      phoneNumber: '',
      phoneCountryCode: '',
      scheduledAt: '',
      timezone: '',
      parentEmail: '',
      purchaseRecording: false,
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue } = form;

  return (
    <Card variant="festive" className="p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">
              Book your Santa call
            </h2>
            <p className="text-gray-600 mt-1">
              One quick form, then review and pay on the next step.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Call price</p>
            <p className="text-xl font-bold text-santa-green">
              ${(pricing.basePrice / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="childName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Child's Name"
                placeholder="Enter first name"
                error={errors.childName?.message}
              />
            )}
          />

          <Controller
            name="childAge"
            control={control}
            render={({ field }) => (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-santa-green focus:border-transparent border-gray-300"
                >
                  <option value="">Select age</option>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((age) => (
                    <option key={age} value={age}>{age} years old</option>
                  ))}
                </select>
                {errors.childAge && (
                  <p className="mt-1 text-sm text-red-500">{errors.childAge.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <PhoneInput
              value={field.value}
              onChange={(value) => {
                field.onChange(value ?? '');
                if (value) {
                  const parsed = parsePhoneNumber(value);
                  if (parsed?.countryCallingCode) {
                    setValue('phoneCountryCode', `+${parsed.countryCallingCode}`);
                  }
                }
              }}
              label="Phone Number"
              error={errors.phoneNumber?.message}
            />
          )}
        />

        <Controller
          name="scheduledAt"
          control={control}
          render={({ field }) => (
            <Controller
              name="timezone"
              control={control}
              render={({ field: tzField }) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  onTimezoneChange={tzField.onChange}
                  label="When should Santa call?"
                  error={errors.scheduledAt?.message}
                />
              )}
            />
          )}
        />

        <div className="space-y-3">
          <Controller
            name="childInfoText"
            control={control}
            render={({ field }) => (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extra details for Santa (optional)
                </label>
                <textarea
                  {...field}
                  rows={4}
                  placeholder="Share interests, recent wins, or anything Santa should mention."
                  className="w-full px-4 py-3 rounded-lg border transition-colors resize-none focus:outline-none focus:ring-2 focus:ring-santa-green focus:border-transparent placeholder:text-gray-400 border-gray-300 hover:border-gray-400"
                />
              </div>
            )}
          />

          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                Prefer to speak? Add a quick voice note for Santa.
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowVoice((prev) => !prev)}
              >
                {showVoice ? 'Hide' : 'Add voice note'}
              </Button>
            </div>
            {showVoice && (
              <div className="mt-3">
                <VoiceRecorder
                  onRecordingChange={onVoiceChange}
                  description="Record up to 2 minutes. We’ll pass this to Santa with your notes."
                  maxDuration={120}
                />
              </div>
            )}
          </div>
        </div>

        <Controller
          name="parentEmail"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              label="Your Email"
              placeholder="you@example.com"
              error={errors.parentEmail?.message}
            />
          )}
        />

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {errorMessage}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Review &amp; Pay
        </Button>
      </form>
    </Card>
  );
}

function BookingReview({
  data,
  bookingResult,
  pricing,
  onEdit,
  flowError,
  setFlowError,
  isSubmitting,
  setIsSubmitting,
  expressReady,
  setExpressReady,
  onCheckout,
  hasVoiceNote,
}: {
  data: BookingFormData;
  bookingResult: BookingResult;
  pricing: PricingInfo;
  onEdit: () => void;
  flowError: string | null;
  setFlowError: (message: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  expressReady: boolean;
  setExpressReady: (value: boolean) => void;
  onCheckout: () => void;
  hasVoiceNote: boolean;
}) {
  const formattedTotal = `$${(bookingResult.amount / 100).toFixed(2)}`;

  const renderExpressCheckout = () => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !stripePromise) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3">
          Payment buttons will appear once Stripe is configured.
        </div>
      );
    }

    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: bookingResult.clientSecret,
          appearance: { theme: 'flat', variables: { borderRadius: '12px' } },
        }}
      >
        <div className="space-y-3">
          <ExpressCheckoutWrapper
            bookingResult={bookingResult}
            setFlowError={setFlowError}
            setIsSubmitting={setIsSubmitting}
            setExpressReady={setExpressReady}
          />
          {!expressReady && (
            <p className="text-sm text-gray-500">
              Apple Pay / Google Pay buttons appear automatically if supported on this device.
            </p>
          )}
        </div>
      </Elements>
    );
  };

  return (
    <Card variant="festive" className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Review &amp; Pay
          </h2>
          <p className="text-gray-600 mt-1">
            Confirm the details, then choose Apple Pay or card checkout.
          </p>
        </div>
        <Button variant="ghost" onClick={onEdit}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Edit details
        </Button>
      </div>

      <div className="space-y-4">
        <ReviewSection title="Child">
          <ReviewItem label="Name" value={data.childName} />
          <ReviewItem label="Age" value={`${data.childAge} years old`} />
          <ReviewItem label="Notes" value={data.childInfoText || '-'} />
          <ReviewItem label="Voice note" value={hasVoiceNote ? 'Attached' : 'None'} />
        </ReviewSection>

        <ReviewSection title="Call">
          <ReviewItem label="Phone" value={data.phoneNumber} />
          <ReviewItem
            label="When"
            value={data.scheduledAt ? new Date(data.scheduledAt).toLocaleString() : 'Call now'}
          />
        </ReviewSection>

        <ReviewSection title="Contact">
          <ReviewItem label="Email" value={data.parentEmail} />
        </ReviewSection>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Santa Call</span>
          <span>${(pricing.basePrice / 100).toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Total</span>
            <Check className="w-4 h-4 text-santa-green" />
          </div>
          <span className="text-xl font-bold text-santa-green">{formattedTotal}</span>
        </div>
      </div>

      {flowError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {flowError}
        </div>
      )}

      <div className="space-y-4">
        {renderExpressCheckout()}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onCheckout}
          disabled={isSubmitting}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Pay with Card
        </Button>
      </div>
    </Card>
  );
}

function ExpressCheckoutWrapper({
  bookingResult,
  setFlowError,
  setIsSubmitting,
  setExpressReady,
}: {
  bookingResult: {
    callId: string;
    clientSecret: string;
  };
  setFlowError: (value: string | null) => void;
  setIsSubmitting: (value: boolean) => void;
  setExpressReady: (value: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <ExpressCheckoutElement
      onReady={({ availablePaymentMethods }) => {
        setExpressReady(Boolean(availablePaymentMethods));
      }}
      onConfirm={async (event) => {
        if (!stripe || !elements) {
          event.paymentFailed?.({ reason: 'fail' });
          setFlowError('Payment is not ready yet. Please try again.');
          return;
        }

        setIsSubmitting(true);
        setFlowError(null);
        try {
          const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: bookingResult.clientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/success?call_id=${bookingResult.callId}`,
            },
            redirect: 'if_required',
          });

          if (error) {
            event.paymentFailed?.({ reason: 'fail' });
            setFlowError(error.message || 'Payment failed. Please try again.');
            setIsSubmitting(false);
            return;
          }

          window.location.href = `/success?call_id=${bookingResult.callId}`;
        } catch (err) {
          console.error('Express checkout error:', err);
          event.paymentFailed?.({ reason: 'fail' });
          setFlowError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
          setIsSubmitting(false);
        }
      }}
    />
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right">{value || '-'}</span>
    </div>
  );
}
