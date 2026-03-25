'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { getCart, placeOrder, validateCoupon } from '@/lib/api';

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
  const [upiOrderId] = useState(`SB${Date.now()}`);
  const [selectedCountry, setSelectedCountry] = useState('IN');

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

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponInput.trim(), subtotal);
      if (result.valid) {
        const discount = Math.round((subtotal * result.discount) / 100);
        setCouponDiscount(discount);
        setCouponCode(couponInput.trim().toUpperCase());
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

  function validateAddress() {
    if (!address.customerName.trim()) { toast.error('Enter your name'); return false; }
    if (!address.customerPhone.trim()) { toast.error('Enter your phone number'); return false; }
    if (!address.line1.trim()) { toast.error('Enter address line 1'); return false; }
    if (!address.city.trim()) { toast.error('Enter city'); return false; }
    if (isIndia && !address.pincode.match(/^\d{6}$/)) { toast.error('Enter valid 6-digit pincode'); return false; }
    if (!isIndia && !address.pincode.trim()) { toast.error(`Enter ${country.postalLabel}`); return false; }
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

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-10">
      {(['address', 'payment', 'confirm'] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            step === s ? 'bg-rose-gold text-white' :
            (['address', 'payment', 'confirm'].indexOf(step) > i) ? 'bg-green-500 text-white' :
            'bg-gray-100 text-gray-400'
          }`}>
            {(['address', 'payment', 'confirm'].indexOf(step) > i) ? '✓' : i + 1}
          </div>
          <span className={`ml-1.5 text-xs capitalize hidden sm:block ${step === s ? 'text-rose-gold font-medium' : 'text-gray-400'}`}>
            {s === 'address' ? 'Delivery' : s === 'payment' ? 'Payment' : 'Confirm'}
          </span>
          {i < 2 && <div className="w-12 h-px bg-gray-200 mx-3" />}
        </div>
      ))}
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
                    onChange={(e) => setAddress({ ...address, customerName: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <div className="flex gap-1">
                    <span className="flex items-center px-2 bg-gray-50 border border-gray-200 rounded-sm text-gray-600 text-xs font-medium whitespace-nowrap">
                      {country.dialCode}
                    </span>
                    <input
                      value={address.customerPhone}
                      onChange={(e) => setAddress({ ...address, customerPhone: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                      placeholder="Phone number"
                    />
                  </div>
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
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                  placeholder="House/flat no., street, area"
                />
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
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                    placeholder="City"
                  />
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
                  <label className="block text-sm font-medium mb-1">{country.postalLabel} *</label>
                  <input
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                    placeholder={country.postalPlaceholder}
                    maxLength={isIndia ? 6 : 10}
                  />
                </div>
              </div>

              {/* Coupon */}
              <div className="border border-gray-200 rounded-sm p-4 bg-warm-white">
                <p className="text-sm font-medium mb-2">Have a coupon?</p>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                    <span className="text-sm text-green-700 font-medium">{couponCode} — ₹{couponDiscount} off</span>
                    <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    />
                    <button onClick={applyCoupon} disabled={couponLoading} className="btn-outline px-4 py-2 text-sm disabled:opacity-50">
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
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
                // Indian payment options
                <div className="space-y-3">
                  {[
                    { id: 'upi' as const, label: 'UPI / PhonePe / GPay / Paytm', desc: 'Instant payment via UPI apps — most popular', icon: '📱', badge: 'Recommended' },
                    { id: 'razorpay' as const, label: 'Pay Online (Razorpay)', desc: 'Debit/Credit cards, Net banking, UPI via Razorpay', icon: '💳' },
                    { id: 'cod' as const, label: 'Cash on Delivery', desc: `Pay when your order arrives (+₹${COD_CHARGE} handling charge)`, icon: '💵' },
                  ].map((method) => (
                    <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-sm cursor-pointer transition-colors ${paymentMethod === method.id ? 'border-rose-gold bg-rose-gold/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="accent-rose-gold" />
                      <span className="text-xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{method.label}</p>
                          {method.badge && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{method.badge}</span>}
                        </div>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                // International: Razorpay (cards) + Bank Transfer
                <div className="space-y-3">
                  {[
                    { id: 'razorpay' as const, label: 'Credit / Debit Card (Razorpay)', desc: 'Visa, Mastercard — secure international checkout', icon: '💳', badge: 'Recommended' },
                    { id: 'bank_transfer' as const, label: 'Bank Transfer (Wire / SWIFT)', desc: 'Transfer to our HDFC account — confirm by email', icon: '🏦' },
                  ].map((method) => (
                    <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-sm cursor-pointer transition-colors ${paymentMethod === method.id ? 'border-rose-gold bg-rose-gold/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="accent-rose-gold" />
                      <span className="text-xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{method.label}</p>
                          {method.badge && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{method.badge}</span>}
                        </div>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                    </label>
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

              {/* UPI QR Code Section */}
              {paymentMethod === 'upi' && (
                <div className="border border-rose-gold/30 rounded-sm p-5 bg-rose-gold/5 text-center">
                  <p className="font-medium text-sm mb-3">Scan QR Code to Pay ₹{total.toLocaleString('en-IN')}</p>
                  <img src={buildQrUrl(total, upiOrderId)} alt="UPI QR Code" className="w-48 h-48 mx-auto border border-gray-200 rounded bg-white p-2" />
                  <p className="text-xs text-gray-500 mt-3 mb-2">Or use UPI ID directly:</p>
                  <div className="bg-white border border-gray-200 rounded px-3 py-2 inline-flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{UPI_ID}</span>
                    <button onClick={() => { navigator.clipboard.writeText(UPI_ID); toast.success('UPI ID copied!'); }} className="text-xs text-rose-gold hover:underline">Copy</button>
                  </div>
                  <div className="flex justify-center gap-3 mt-4">
                    <a href={`phonepe://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${total.toFixed(2)}&cu=INR`} className="bg-purple-600 text-white px-3 py-2 rounded text-xs font-medium">PhonePe</a>
                    <a href={`tez://upi/pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${total.toFixed(2)}&cu=INR`} className="bg-blue-500 text-white px-3 py-2 rounded text-xs font-medium">GPay</a>
                    <a href={`paytmmp://pay?pa=${UPI_ID}&pn=${STORE_NAME}&am=${total.toFixed(2)}&cu=INR`} className="bg-blue-400 text-white px-3 py-2 rounded text-xs font-medium">Paytm</a>
                  </div>
                  <p className="text-xs text-amber-600 mt-3 font-medium">After payment, proceed to place your order below. We&apos;ll verify & confirm within 1 hour.</p>
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

        {/* Order Summary Sidebar */}
        <div className="bg-warm-white rounded-sm p-5 h-fit sticky top-24">
          <h3 className="font-serif text-lg mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600 line-clamp-1 flex-1">{item.product.name} ×{item.quantity}</span>
                <span className="ml-2 flex-shrink-0">₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping ({country.name})</span>
              <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}</span>
            </div>
            {paymentMethod === 'cod' && (
              <div className="flex justify-between text-amber-600">
                <span>COD Charge</span><span>₹{COD_CHARGE}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({couponCode})</span><span>-₹{couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t pt-2 mt-1">
              <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          {savings > 0 && (
            <div className="mt-3 bg-green-50 rounded px-3 py-2 text-center">
              <p className="text-green-600 text-xs font-medium">You save ₹{savings.toLocaleString('en-IN')}</p>
            </div>
          )}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>✓ Secure checkout · Easy 7-day returns</p>
            {!isIndia && <p>✓ International shipping available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
