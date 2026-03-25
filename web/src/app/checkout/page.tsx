'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { getCart, placeOrder, validateCoupon, getBestCoupons, CouponSuggestion } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Step = 'address' | 'payment' | 'confirm';

const UPI_ID = 'srinidhioboutique@ybl';
const STORE_NAME = 'Srinidhi+Boutique';
const COD_CHARGE = 50;

// Country config
const COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '+91', postalLabel: 'Pincode', postalPattern: /^\d{6}$/, postalPlaceholder: '6-digit pincode' },
  { code: 'US', name: 'United States', dialCode: '+1', postalLabel: 'ZIP Code', postalPattern: /^\d{5}(-\d{4})?$/, postalPlaceholder: '5-digit ZIP' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', postalLabel: 'Postal Code', postalPattern: /^.{3,10}$/, postalPlaceholder: 'Postal code' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', postalLabel: 'Postcode', postalPattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, postalPlaceholder: 'e.g. SW1A 1AA' },
  { code: 'CA', name: 'Canada', dialCode: '+1', postalLabel: 'Postal Code', postalPattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, postalPlaceholder: 'e.g. K1A 0A9' },
  { code: 'AU', name: 'Australia', dialCode: '+61', postalLabel: 'Postcode', postalPattern: /^\d{4}$/, postalPlaceholder: '4-digit postcode' },
  { code: 'OTHER', name: 'Other Country', dialCode: '+', postalLabel: 'Postal Code', postalPattern: /^.{2,10}$/, postalPlaceholder: 'Postal code' },
];

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming','Washington DC',
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Other',
];

// Shipping rates
const SHIPPING_RATES: Record<string, { rate: number; freeAbove?: number; days: string }> = {
  IN:    { rate: 99,   freeAbove: 999, days: '3-7' },
  US:    { rate: 1499,                 days: '10-15' },
  AE:    { rate: 999,                  days: '12-20' },
  GB:    { rate: 1299,                 days: '12-20' },
  OTHER: { rate: 1999,                 days: '12-20' },
};

function getShipping(subtotal: number, countryCode: string): number {
  const cfg = SHIPPING_RATES[countryCode] || SHIPPING_RATES['OTHER'];
  if (cfg.freeAbove !== undefined && subtotal >= cfg.freeAbove) return 0;
  return cfg.rate;
}

function getDelivery(countryCode: string): string {
  return (SHIPPING_RATES[countryCode] || SHIPPING_RATES['OTHER']).days + ' business days';
}

function buildUpiLink(amount: number, orderId: string) {
  return `upi://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${amount.toFixed(2)}&cu=INR&tn=Order+${orderId}`;
}

function buildQrUrl(amount: number, orderId: string) {
  const upiLink = buildUpiLink(amount, orderId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionId, setItemCount } = useCartStore();
  const [step, setStep] = useState<Step>('address');
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState(searchParams.get('coupon') || '');
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<CouponSuggestion[]>([]);
  const [upiOrderId] = useState(`SB${Date.now()}`);
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const country = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
  const isIndia = selectedCountry === 'IN';

  const [address, setAddress] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    line1: '',
    line2: '',
    city: '',
    state: isIndia ? 'Telangana' : '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay' | 'upi' | 'bank_transfer'>('cod');

  // Reset payment method when country changes
  useEffect(() => {
    if (!isIndia) {
      setPaymentMethod('razorpay');
    } else {
      setPaymentMethod('cod');
    }
    setAddress((prev) => ({ ...prev, state: '' }));
  }, [selectedCountry, isIndia]);

  const { data: cart } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => getCart(sessionId),
  });

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = getShipping(subtotal, selectedCountry);
  const codCharge = paymentMethod === 'cod' ? COD_CHARGE : 0;
  const total = subtotal + shipping + codCharge - couponDiscount;
  const savings = (cart?.items || []).reduce((sum, item) => {
    const comparePrice = Number(item.product.comparePrice || 0);
    const price = Number(item.product.price);
    return sum + Math.max(0, comparePrice - price) * item.quantity;
  }, 0) + couponDiscount;

  useEffect(() => {
    if (searchParams.get('coupon')) {
      setCouponInput(searchParams.get('coupon') || '');
    }
  }, [searchParams]);

  useEffect(() => {
    if (subtotal > 0) {
      getBestCoupons(subtotal)
        .then((data) => setAvailableCoupons(data.coupons || []))
        .catch(() => {});
    }
  }, [subtotal]);

  async function applyCoupon(overrideCode?: string) {
    const code = overrideCode ?? couponInput;
    if (!code.trim()) return;
    if (overrideCode) setCouponInput(overrideCode);
    setCouponLoading(true);
    try {
      const result = await validateCoupon(code.trim(), subtotal);
      if (result.valid) {
        const discount = result.type === 'flat'
          ? Math.min(result.discount, subtotal)
          : Math.round((subtotal * result.discount) / 100);
        setCouponDiscount(discount);
        setCouponCode(code.trim().toUpperCase());
        setCouponApplied(true);
        toast.success(`Coupon applied! You save ₹${discount}`);
      } else {
        toast.error(result.message || 'Invalid coupon');
      }
    } catch {
      toast.error('Could not apply coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponDiscount(0);
    setCouponCode('');
    setCouponApplied(false);
    setCouponInput('');
  }

  function formatIndianPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  async function handlePincodeBlur(pincode: string) {
    if (!isIndia || pincode.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/pincode/${pincode}`);
      const data = await res.json();
      if (data.available && data.city) {
        setAddress((prev) => ({
          ...prev,
          city: data.city || prev.city,
          state: data.state || prev.state,
        }));
        setFieldErrors((prev) => ({ ...prev, city: '', pincode: '' }));
      }
    } catch {
      // silently ignore pincode lookup failures
    } finally {
      setPincodeLoading(false);
    }
  }

  function validateAddress() {
    const errors: Record<string, string> = {};
    if (!address.customerName.trim()) errors.customerName = 'Enter your full name';
    if (!address.customerPhone.trim()) {
      errors.customerPhone = 'Enter your phone number';
    } else if (isIndia && address.customerPhone.replace(/\D/g, '').length < 10) {
      errors.customerPhone = 'Enter a valid 10-digit mobile number';
    }
    if (!address.line1.trim()) errors.line1 = 'Enter your address';
    if (!address.city.trim()) errors.city = 'Enter your city';
    if (isIndia && !address.pincode.match(/^\d{6}$/)) {
      errors.pincode = 'Enter valid 6-digit pincode';
    } else if (!isIndia && !address.pincode.trim()) {
      errors.pincode = `Enter ${country.postalLabel}`;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return false;
    }
    return true;
  }

  async function handlePlaceOrder(razorpayPaymentId?: string) {
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    setSubmitting(true);
    try {
      const order = await placeOrder({
        customerName: address.customerName,
        customerPhone: address.customerPhone,
        customerEmail: address.customerEmail || undefined,
        address: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: selectedCountry,
        },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
        paymentMethod,
        paymentId: razorpayPaymentId,
        couponCode: couponCode || undefined,
        sessionId,
        country: selectedCountry,
      });
      setItemCount(0);
      router.push(`/order/${order.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to place order';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRazorpayPayment() {
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, receipt: `cart_${sessionId}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment order');

      if (!(window as unknown as Record<string, unknown>)['Razorpay']) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.body.appendChild(script);
        });
      }

      const RazorpayClass = (window as unknown as Record<string, unknown>)['Razorpay'] as new (opts: Record<string, unknown>) => { open(): void };
      const rzp = new RazorpayClass({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Srinidhi Boutique',
        description: `Order — ${items.length} item${items.length > 1 ? 's' : ''}`,
        order_id: data.id,
        prefill: {
          name: address.customerName,
          contact: address.customerPhone,
          email: address.customerEmail || undefined,
        },
        theme: { color: '#B76E79' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) throw new Error('Payment verification failed');
            toast.success('Payment successful!');
            await handlePlaceOrder(response.razorpay_payment_id);
          } catch {
            toast.error('Payment verification failed. Contact support.');
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => { setSubmitting(false); toast.error('Payment cancelled'); },
        },
      });
      rzp.open();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Payment failed');
      setSubmitting(false);
    }
  }

  async function handleBankTransfer() {
    // Bank transfer: place order with pending payment status, customer sends proof separately
    await handlePlaceOrder();
  }

  const STEPS: { key: Step; label: string }[] = [
    { key: 'address', label: 'Delivery' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirm', label: 'Confirm' },
  ];
  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const StepIndicator = () => (
    <div className="mb-10">
      {/* Glass progress bar */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-full px-6 py-3 shadow-sm flex items-center justify-between max-w-sm mx-auto">
        {STEPS.map((s, i) => {
          const done = currentStepIndex > i;
          const active = currentStepIndex === i;
          return (
            <div key={s.key} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done ? 'bg-green-500 text-white' : active ? 'bg-[#1a1a2e] text-[#c5a55a]' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`ml-1.5 text-xs hidden sm:block font-medium transition-colors ${active ? 'text-[#1a1a2e]' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < 2 && (
                <div className={`w-10 h-0.5 mx-3 rounded-full transition-all duration-500 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-3xl text-center mb-2">Checkout</h1>
      <StepIndicator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Step 1: Address */}
          {step === 'address' && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl">Delivery Details</h2>

              {/* Country Selector */}
              <div>
                <label className="block text-sm font-medium mb-1">Ship To *</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.dialCode})</option>
                  ))}
                </select>
                {!isIndia && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs text-blue-700">
                    International shipping to {country.name} — ₹{(SHIPPING_RATES[selectedCountry] || SHIPPING_RATES['OTHER']).rate} flat rate · Est. {getDelivery(selectedCountry)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    value={address.customerName}
                    onChange={(e) => { setAddress({ ...address, customerName: e.target.value }); setFieldErrors((p) => ({ ...p, customerName: '' })); }}
                    className={`w-full border rounded-sm px-3 py-2.5 focus:outline-none text-sm ${fieldErrors.customerName ? 'border-red-400 bg-red-50/30 focus:border-red-400' : 'border-gray-200 focus:border-rose-gold'}`}
                    placeholder="Your full name"
                  />
                  {fieldErrors.customerName && <p className="text-red-500 text-xs mt-1">{fieldErrors.customerName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <div className="flex gap-1">
                    <span className="flex items-center px-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-600 text-xs font-medium whitespace-nowrap">
                      {country.dialCode}
                    </span>
                    <input
                      value={address.customerPhone}
                      onChange={(e) => {
                        const formatted = isIndia ? formatIndianPhone(e.target.value) : e.target.value;
                        setAddress({ ...address, customerPhone: formatted });
                        setFieldErrors((p) => ({ ...p, customerPhone: '' }));
                      }}
                      className={`flex-1 border rounded-sm px-3 py-2.5 focus:outline-none text-sm ${fieldErrors.customerPhone ? 'border-red-400 bg-red-50/30 focus:border-red-400' : 'border-gray-200 focus:border-rose-gold'}`}
                      placeholder={isIndia ? '98765 43210' : 'Phone number'}
                      inputMode="numeric"
                    />
                  </div>
                  {fieldErrors.customerPhone && <p className="text-red-500 text-xs mt-1">{fieldErrors.customerPhone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                <input
                  value={address.customerEmail}
                  onChange={(e) => setAddress({ ...address, customerEmail: e.target.value })}
                  type="email"
                  className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                  placeholder="For order updates"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                <input
                  value={address.line1}
                  onChange={(e) => { setAddress({ ...address, line1: e.target.value }); setFieldErrors((p) => ({ ...p, line1: '' })); }}
                  className={`w-full border rounded-sm px-3 py-2.5 focus:outline-none text-sm ${fieldErrors.line1 ? 'border-red-400 bg-red-50/30 focus:border-red-400' : 'border-gray-200 focus:border-rose-gold'}`}
                  placeholder="House/flat no., street, area"
                />
                {fieldErrors.line1 && <p className="text-red-500 text-xs mt-1">{fieldErrors.line1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address Line 2</label>
                <input
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                  placeholder="Landmark / apartment (optional)"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    value={address.city}
                    onChange={(e) => { setAddress({ ...address, city: e.target.value }); setFieldErrors((p) => ({ ...p, city: '' })); }}
                    className={`w-full border rounded-sm px-3 py-2.5 focus:outline-none text-sm ${fieldErrors.city ? 'border-red-400 bg-red-50/30 focus:border-red-400' : 'border-gray-200 focus:border-rose-gold'}`}
                    placeholder="City"
                  />
                  {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State / Province</label>
                  {isIndia ? (
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm bg-white"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : selectedCountry === 'US' ? (
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm bg-white"
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                      placeholder="State / Province"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {country.postalLabel} *{pincodeLoading && <span className="text-xs text-[#c5a55a] ml-2">Looking up...</span>}
                  </label>
                  <input
                    value={address.pincode}
                    onChange={(e) => {
                      const val = isIndia ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value;
                      setAddress({ ...address, pincode: val });
                      setFieldErrors((p) => ({ ...p, pincode: '' }));
                    }}
                    onBlur={(e) => handlePincodeBlur(e.target.value)}
                    className={`w-full border rounded-sm px-3 py-2.5 focus:outline-none text-sm ${fieldErrors.pincode ? 'border-red-400 bg-red-50/30 focus:border-red-400' : 'border-gray-200 focus:border-rose-gold'}`}
                    placeholder={country.postalPlaceholder}
                    maxLength={isIndia ? 6 : 10}
                    inputMode={isIndia ? 'numeric' : 'text'}
                  />
                  {fieldErrors.pincode && <p className="text-red-500 text-xs mt-1">{fieldErrors.pincode}</p>}
                </div>
              </div>

              {/* Coupon */}
              <div className="border border-gray-200 rounded-sm p-4 bg-warm-white space-y-3">
                <p className="text-sm font-medium">Have a coupon?</p>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                    <span className="text-sm text-green-700 font-medium">{couponCode} — ₹{couponDiscount} off</span>
                    <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 border border-gray-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <button onClick={() => applyCoupon()} disabled={couponLoading} className="btn-outline px-4 py-2 text-sm disabled:opacity-50">
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                    {availableCoupons.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Available coupons for your order:</p>
                        <div className="space-y-2">
                          {availableCoupons.map((c, idx) => (
                            <div
                              key={c.code}
                              className={`flex items-center justify-between rounded px-3 py-2 border ${idx === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                {idx === 0 && (
                                  <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">Best</span>
                                )}
                                <span className="text-sm font-mono font-semibold text-[#1a1a2e]">{c.code}</span>
                                <span className="text-xs text-gray-500">
                                  {c.type === 'flat' ? `₹${c.discount} off` : `${c.discount}% off`}
                                  {' '}· saves ₹{Math.round(c.discountAmount)}
                                </span>
                              </div>
                              <button
                                onClick={() => applyCoupon(c.code)}
                                className="text-xs font-medium text-[#c5a55a] hover:text-[#1a1a2e] transition-colors"
                              >
                                Apply
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => { if (validateAddress()) setStep('payment'); }}
                className="btn-primary w-full mt-4 py-3 tracking-widest text-sm"
              >
                CONTINUE TO PAYMENT
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl">Payment Method</h2>

              {isIndia ? (
                // Indian payment options — glass cards
                <div className="space-y-3">
                  {[
                    { id: 'upi' as const, label: 'UPI / PhonePe / GPay / Paytm', desc: 'Instant payment via UPI apps — most popular', icon: '📱', badge: 'Recommended' },
                    { id: 'razorpay' as const, label: 'Pay Online (Razorpay)', desc: 'Debit/Credit cards, Net banking, UPI via Razorpay', icon: '💳' },
                    { id: 'cod' as const, label: 'Cash on Delivery', desc: `Pay when your order arrives (+₹${COD_CHARGE} handling charge)`, icon: '💵' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left ${
                        paymentMethod === method.id
                          ? 'border-[#1a1a2e] bg-[#1a1a2e]/5 shadow-md'
                          : 'border-white/40 bg-white/50 backdrop-blur-xl hover:border-[#1a1a2e]/30 hover:bg-white/70'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-[#1a1a2e]">{method.label}</p>
                          {method.badge && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{method.badge}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === method.id ? 'border-[#1a1a2e] bg-[#1a1a2e]' : 'border-gray-300'
                      }`}>
                        {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-[#c5a55a]" />}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                // International: Razorpay (cards) + Bank Transfer
                <div className="space-y-3">
                  {[
                    { id: 'razorpay' as const, label: 'Credit / Debit Card (Razorpay)', desc: 'Visa, Mastercard — secure international checkout', icon: '💳', badge: 'Recommended' },
                    { id: 'bank_transfer' as const, label: 'Bank Transfer (Wire / SWIFT)', desc: 'Transfer to our HDFC account — confirm by email', icon: '🏦' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-left ${
                        paymentMethod === method.id
                          ? 'border-[#1a1a2e] bg-[#1a1a2e]/5 shadow-md'
                          : 'border-white/40 bg-white/50 backdrop-blur-xl hover:border-[#1a1a2e]/30 hover:bg-white/70'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-[#1a1a2e]">{method.label}</p>
                          {method.badge && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{method.badge}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === method.id ? 'border-[#1a1a2e] bg-[#1a1a2e]' : 'border-gray-300'
                      }`}>
                        {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-[#c5a55a]" />}
                      </div>
                    </button>
                  ))}
                  <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-700">
                    All prices in ₹ INR. Your bank will convert to your local currency.
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <div className="border border-blue-200 rounded-sm p-4 bg-blue-50 text-sm space-y-1">
                      <p className="font-medium text-blue-800 mb-2">Bank Transfer Details</p>
                      <p><span className="text-gray-600">Bank:</span> HDFC Bank</p>
                      <p><span className="text-gray-600">Account Name:</span> Srinidhi Boutique</p>
                      <p><span className="text-gray-600">SWIFT / BIC:</span> HDFCINBB</p>
                      <p className="text-xs text-blue-700 mt-2">After placing your order, you will receive the full account details. Email payment proof to srinidhiboutique@gmail.com with your order number.</p>
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR Code — Glass Card */}
              {paymentMethod === 'upi' && (
                <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 text-center shadow-card">
                  <p className="font-semibold text-sm text-[#1a1a2e] mb-1">Scan QR Code to Pay</p>
                  <p className="text-2xl font-bold text-[#c5a55a] mb-4">&#x20B9;{total.toLocaleString('en-IN')}</p>
                  <div className="bg-white rounded-2xl p-3 inline-block shadow-sm border border-white/60 mb-3">
                    <img src={buildQrUrl(total, upiOrderId)} alt="UPI QR Code" className="w-44 h-44" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Or pay directly with UPI ID:</p>
                  <div className="bg-white/80 border border-white/60 rounded-2xl px-4 py-2.5 inline-flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#1a1a2e]">{UPI_ID}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(UPI_ID); toast.success('UPI ID copied!'); }}
                      className="text-xs bg-[#1a1a2e] text-[#c5a55a] px-2.5 py-1 rounded-full font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex justify-center gap-2 mt-4">
                    <a href={`phonepe://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${total.toFixed(2)}&cu=INR`} className="bg-purple-600 text-white px-4 py-2 rounded-full text-xs font-semibold">PhonePe</a>
                    <a href={`tez://upi/pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${total.toFixed(2)}&cu=INR`} className="bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-semibold">GPay</a>
                    <a href={`paytmmp://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${total.toFixed(2)}&cu=INR`} className="bg-blue-400 text-white px-4 py-2 rounded-full text-xs font-semibold">Paytm</a>
                  </div>
                  <p className="text-xs text-amber-600 mt-3 font-medium bg-amber-50 rounded-xl px-3 py-2">After payment, proceed to place your order below. We&apos;ll verify &amp; confirm within 1 hour.</p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('address')} className="btn-outline flex-1 py-3 text-sm">Back</button>
                <button onClick={() => setStep('confirm')} className="btn-primary flex-1 py-3 text-sm tracking-widest">REVIEW ORDER</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <h2 className="font-serif text-xl">Review Your Order</h2>
              <div className="bg-warm-white rounded-sm p-4">
                <h3 className="text-sm font-medium mb-2">Delivery To</h3>
                <p className="text-sm">{address.customerName} · {country.dialCode} {address.customerPhone}</p>
                <p className="text-sm text-gray-600">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p className="text-sm text-gray-600">{address.city}, {address.state && `${address.state}, `}{address.pincode}</p>
                <p className="text-sm text-gray-600">{country.name}</p>
                <p className="text-xs text-blue-600 mt-1">Est. delivery: {getDelivery(selectedCountry)}</p>
              </div>
              <div className="bg-warm-white rounded-sm p-4">
                <h3 className="text-sm font-medium mb-1">Payment Method</h3>
                <p className="text-sm">
                  {paymentMethod === 'cod' ? `Cash on Delivery (+₹${COD_CHARGE} handling)` :
                   paymentMethod === 'razorpay' ? 'Razorpay (Cards / UPI / Net Banking)' :
                   paymentMethod === 'bank_transfer' ? 'Bank Transfer (Wire / SWIFT)' : 'UPI Direct'}
                </p>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium flex-1 line-clamp-1">{item.product.name}</span>
                    {item.size && <span className="text-gray-400 text-xs">({item.size})</span>}
                    <span className="text-gray-500">×{item.quantity}</span>
                    <span className="font-medium">₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              {savings > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-sm p-3 text-center">
                  <p className="text-green-700 font-medium text-sm">You are saving ₹{savings.toLocaleString('en-IN')} on this order!</p>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('payment')} className="btn-outline flex-1 py-3 text-sm">Back</button>
                <button
                  onClick={
                    paymentMethod === 'razorpay' ? handleRazorpayPayment :
                    paymentMethod === 'bank_transfer' ? handleBankTransfer :
                    () => handlePlaceOrder()
                  }
                  disabled={submitting}
                  className="btn-primary flex-1 py-3 text-sm tracking-widest disabled:opacity-50"
                >
                  {submitting
                    ? (paymentMethod === 'razorpay' ? 'OPENING PAYMENT...' : 'PLACING ORDER...')
                    : (paymentMethod === 'razorpay' ? 'PAY NOW' : paymentMethod === 'bank_transfer' ? 'PLACE ORDER (BANK TRANSFER)' : 'PLACE ORDER')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar — Glass */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl p-5 h-fit sticky top-24 shadow-card">
          <h3 className="font-serif text-lg text-[#1a1a2e] mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600 line-clamp-1 flex-1">{item.product.name} ×{item.quantity}</span>
                <span className="ml-2 flex-shrink-0 font-medium">&#x20B9;{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/40 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>&#x20B9;{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping ({country.name})</span>
              <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}</span>
            </div>
            {paymentMethod === 'cod' && (
              <div className="flex justify-between text-amber-600">
                <span>COD Charge</span><span>&#x20B9;{COD_CHARGE}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({couponCode})</span><span>-&#x20B9;{couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-white/40 pt-2.5 mt-1 text-[#1a1a2e]">
              <span>Total</span>
              <span className="text-[#c5a55a]">&#x20B9;{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          {savings > 0 && (
            <div className="mt-3 bg-green-50/80 rounded-2xl px-3 py-2 text-center">
              <p className="text-green-600 text-xs font-semibold">You save &#x20B9;{savings.toLocaleString('en-IN')} on this order!</p>
            </div>
          )}
          <div className="mt-4 space-y-1.5">
            {['Secure checkout', 'Easy 7-day returns', 'Genuine products'].map((t) => (
              <p key={t} className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="text-green-500">✓</span> {t}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
