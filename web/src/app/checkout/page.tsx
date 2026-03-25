'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { getCart, placeOrder } from '@/lib/api';

type Step = 'address' | 'payment' | 'confirm';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra',
  'Gujarat', 'Rajasthan', 'Delhi', 'Uttar Pradesh', 'West Bengal',
  'Madhya Pradesh', 'Kerala', 'Punjab', 'Haryana', 'Bihar', 'Other',
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get('coupon') || '';
  const { sessionId, setItemCount } = useCartStore();
  const [step, setStep] = useState<Step>('address');
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Telangana',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay' | 'upi'>('cod');

  const { data: cart } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => getCart(sessionId),
  });

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  function validateAddress() {
    if (!address.customerName.trim()) { toast.error('Enter your name'); return false; }
    if (!address.customerPhone.match(/^\d{10}$/)) { toast.error('Enter valid 10-digit phone number'); return false; }
    if (!address.line1.trim()) { toast.error('Enter address line 1'); return false; }
    if (!address.city.trim()) { toast.error('Enter city'); return false; }
    if (!address.pincode.match(/^\d{6}$/)) { toast.error('Enter valid 6-digit pincode'); return false; }
    return true;
  }

  async function handlePlaceOrder() {
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
        },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
        paymentMethod,
        couponCode: couponCode || undefined,
        sessionId,
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
            {s}
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
                  <input
                    value={address.customerPhone}
                    onChange={(e) => setAddress({ ...address, customerPhone: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email (optional)</label>
                <input
                  value={address.customerEmail}
                  onChange={(e) => setAddress({ ...address, customerEmail: e.target.value })}
                  type="email"
                  className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                  placeholder="For order updates (optional)"
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
                  placeholder="Landmark (optional)"
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
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm bg-white"
                  >
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pincode *</label>
                  <input
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                </div>
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
              <div className="space-y-3">
                {[
                  { id: 'cod' as const, label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: '💵' },
                  { id: 'razorpay' as const, label: 'Pay Online (Razorpay)', desc: 'UPI, Debit/Credit cards, Net banking', icon: '💳' },
                  { id: 'upi' as const, label: 'UPI Direct', desc: 'Pay via PhonePe, GPay, Paytm', icon: '📱' },
                ].map((method) => (
                  <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-sm cursor-pointer transition-colors ${
                    paymentMethod === method.id ? 'border-rose-gold bg-rose-gold/5' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="accent-rose-gold"
                    />
                    <span className="text-xl">{method.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('address')} className="btn-outline flex-1 py-3 text-sm">
                  Back
                </button>
                <button onClick={() => setStep('confirm')} className="btn-primary flex-1 py-3 text-sm tracking-widest">
                  REVIEW ORDER
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <h2 className="font-serif text-xl">Review Your Order</h2>
              <div className="bg-warm-white rounded-sm p-4">
                <h3 className="text-sm font-medium mb-2">Delivery To</h3>
                <p className="text-sm">{address.customerName} · {address.customerPhone}</p>
                <p className="text-sm text-gray-600">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p className="text-sm text-gray-600">{address.city}, {address.state} — {address.pincode}</p>
              </div>
              <div className="bg-warm-white rounded-sm p-4">
                <h3 className="text-sm font-medium mb-2">Payment Method</h3>
                <p className="text-sm capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'razorpay' ? 'Razorpay (Online)' : 'UPI Direct'}</p>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <span className="font-medium flex-1 line-clamp-1">{item.product.name}</span>
                    <span className="text-gray-500">×{item.quantity}</span>
                    <span className="font-medium">₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('payment')} className="btn-outline flex-1 py-3 text-sm">
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="btn-primary flex-1 py-3 text-sm tracking-widest disabled:opacity-50"
                >
                  {submitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-warm-white rounded-sm p-5">
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
              <span>Shipping</span>
              <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            {couponCode && (
              <div className="flex justify-between text-green-600">
                <span>{couponCode}</span><span>Applied ✓</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t pt-2 mt-1">
              <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
