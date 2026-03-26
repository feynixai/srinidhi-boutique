'use client';
import { useState } from 'react';

/* ── Data ─────────────────────────────────────────────────────────── */

const TABS = ['Sarees', 'Kurtis', 'Lehengas', 'Blouses'] as const;
type Tab = (typeof TABS)[number];

const BLOUSE_SIZES = [
  { size: '32', chest: { in: 32, cm: 81 }, shoulder: { in: 13, cm: 33 }, sleeve: { in: 5.5, cm: 14 }, back: { in: 14, cm: 36 } },
  { size: '34', chest: { in: 34, cm: 86 }, shoulder: { in: 13.5, cm: 34 }, sleeve: { in: 6, cm: 15 }, back: { in: 14.5, cm: 37 } },
  { size: '36', chest: { in: 36, cm: 91 }, shoulder: { in: 14, cm: 36 }, sleeve: { in: 6, cm: 15 }, back: { in: 15, cm: 38 } },
  { size: '38', chest: { in: 38, cm: 97 }, shoulder: { in: 14.5, cm: 37 }, sleeve: { in: 6.5, cm: 17 }, back: { in: 15, cm: 38 } },
  { size: '40', chest: { in: 40, cm: 102 }, shoulder: { in: 15, cm: 38 }, sleeve: { in: 6.5, cm: 17 }, back: { in: 15.5, cm: 39 } },
  { size: '42', chest: { in: 42, cm: 107 }, shoulder: { in: 15.5, cm: 39 }, sleeve: { in: 7, cm: 18 }, back: { in: 16, cm: 41 } },
  { size: '44', chest: { in: 44, cm: 112 }, shoulder: { in: 16, cm: 41 }, sleeve: { in: 7, cm: 18 }, back: { in: 16, cm: 41 } },
];

const KURTI_SIZES = [
  { size: 'XS', chest: '32"', waist: '26"', hip: '36"', shortLen: '32"', regLen: '38"', longLen: '44"', sleeve: '18"' },
  { size: 'S', chest: '34"', waist: '28"', hip: '38"', shortLen: '33"', regLen: '39"', longLen: '45"', sleeve: '18.5"' },
  { size: 'M', chest: '36"', waist: '30"', hip: '40"', shortLen: '34"', regLen: '40"', longLen: '46"', sleeve: '19"' },
  { size: 'L', chest: '38"', waist: '32"', hip: '42"', shortLen: '35"', regLen: '41"', longLen: '47"', sleeve: '19.5"' },
  { size: 'XL', chest: '40"', waist: '34"', hip: '44"', shortLen: '36"', regLen: '42"', longLen: '48"', sleeve: '20"' },
  { size: '2XL', chest: '42"', waist: '36"', hip: '46"', shortLen: '37"', regLen: '43"', longLen: '49"', sleeve: '20.5"' },
  { size: '3XL', chest: '44"', waist: '38"', hip: '48"', shortLen: '38"', regLen: '44"', longLen: '50"', sleeve: '21"' },
];

const LEHENGA_SIZES = [
  { size: 'XS', waist: '26"', hip: '36"', length: '40"', canCan: '1 layer' },
  { size: 'S', waist: '28"', hip: '38"', length: '40"', canCan: '1 layer' },
  { size: 'M', waist: '30"', hip: '40"', length: '41"', canCan: '2 layers' },
  { size: 'L', waist: '32"', hip: '42"', length: '42"', canCan: '2 layers' },
  { size: 'XL', waist: '34"', hip: '44"', length: '42"', canCan: '2 layers' },
  { size: '2XL', waist: '36"', hip: '46"', length: '43"', canCan: '3 layers' },
  { size: '3XL', waist: '38"', hip: '48"', length: '44"', canCan: '3 layers' },
];

const HOW_TO_MEASURE = [
  { point: 'Chest / Bust', instruction: 'Wrap the tape around the fullest part of your bust, keeping it level across the back.' },
  { point: 'Waist', instruction: 'Measure around your natural waistline (the narrowest point), keeping the tape comfortably loose.' },
  { point: 'Hip', instruction: 'Stand with feet together and measure around the fullest part of your hips/buttocks.' },
  { point: 'Shoulder', instruction: 'Measure from one shoulder edge to the other across the back.' },
  { point: 'Sleeve Length', instruction: 'Measure from the shoulder point down to the desired length (elbow for half-sleeve, wrist for full).' },
  { point: 'Back Length', instruction: 'Measure from the nape of your neck (base of the back of the neck) down to the desired blouse length.' },
  { point: 'Length (Kurti/Lehenga)', instruction: 'Measure from the shoulder point (or waist for lehengas) down to the desired hemline.' },
];

/* ── Component ────────────────────────────────────────────────────── */

interface SizeGuideContentProps {
  whatsappLink?: string;
}

export function SizeGuideContent({ whatsappLink }: SizeGuideContentProps = {}) {
  const [activeTab, setActiveTab] = useState<Tab>('Sarees');
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#c5a55a] text-white shadow-lg shadow-[#c5a55a]/30'
                : 'bg-[#1a1a2e]/5 text-[#1a1a2e]/50 hover:bg-gray-100 hover:text-[#1a1a2e]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'Sarees' && <SareeTab />}
        {activeTab === 'Kurtis' && <KurtiTab />}
        {activeTab === 'Lehengas' && <LehengaTab />}
        {activeTab === 'Blouses' && <BlouseTab unit={unit} setUnit={setUnit} />}
      </div>

      {/* How to Measure */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-serif text-lg text-white mb-4">📐 How to Measure</h4>
        <div className="space-y-3">
          {HOW_TO_MEASURE.map((item) => (
            <div key={item.point} className="bg-[#1a1a2e]/5 rounded-2xl p-3">
              <p className="text-[#c5a55a] text-sm font-semibold mb-1">{item.point}</p>
              <p className="text-white/70 text-sm leading-relaxed">{item.instruction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp CTA */}
      <a
        href={whatsappLink || "https://wa.me/918309949805?text=Hi%2C%20I%20need%20help%20with%20sizing"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-[#1a1a2e] font-semibold rounded-full transition-colors text-sm"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Not sure? WhatsApp us!
      </a>

      <p className="text-center text-white/40 text-xs">
        Tip: If you&apos;re between sizes, go one size up for a comfortable fit.
      </p>
    </div>
  );
}

/* ── Sub-tabs ─────────────────────────────────────────────────────── */

function SareeTab() {
  return (
    <div className="space-y-4">
      <div className="bg-[#1a1a2e]/5 rounded-2xl p-4 space-y-3">
        <h4 className="text-[#c5a55a] font-semibold text-sm">Standard Saree</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoCard label="Length" value="5.5 metres" />
          <InfoCard label="Width" value="1.15 metres" />
          <InfoCard label="Blouse Piece" value="0.8 metres (included)" />
          <InfoCard label="Weight" value="Varies by fabric" />
        </div>
      </div>

      <div className="bg-[#1a1a2e]/5 rounded-2xl p-4">
        <h4 className="text-[#c5a55a] font-semibold text-sm mb-3">Draping Style Tips</h4>
        <div className="space-y-2 text-sm text-white/70">
          <DrapeTip title="Nivi Style (Most common)" desc="The pallu is draped over the left shoulder. Works for all body types and occasions." />
          <DrapeTip title="Gujarati / Seedha Pallu" desc="Pallu is brought from back to front over the right shoulder. Great for heavy-border sarees." />
          <DrapeTip title="Bengali Style" desc="No pleats at the front. Pallu is pinned at the left shoulder with decorative key-hole pleats." />
          <DrapeTip title="Lehenga Style" desc="Pre-pleated and pinned to look like a lehenga. Best for heavy fabrics like Banarasi." />
        </div>
      </div>

      <div className="bg-[#c5a55a]/10 border border-[#c5a55a]/20 rounded-2xl p-4 text-sm text-[#1a1a2e]/70">
        <p className="font-medium text-[#c5a55a] mb-1">💡 Pro Tip</p>
        <p>All our sarees come with an unstitched blouse piece. You can get it stitched to your exact measurements at any local tailor.</p>
      </div>
    </div>
  );
}

function KurtiTab() {
  return (
    <div className="space-y-4">
      <p className="text-[#1a1a2e]/50 text-xs">All measurements in inches. Measure at the fullest point.</p>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm border-collapse min-w-[500px]">
          <thead>
            <tr className="text-left">
              <Th>Size</Th>
              <Th>Chest</Th>
              <Th>Waist</Th>
              <Th>Hip</Th>
              <Th>Sleeve</Th>
            </tr>
          </thead>
          <tbody>
            {KURTI_SIZES.map((r) => (
              <tr key={r.size} className="border-t border-white/5 hover:bg-[#1a1a2e]/5 transition-colors">
                <td className="py-2.5 px-2 font-semibold text-[#c5a55a]">{r.size}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.chest}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.waist}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.hip}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.sleeve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1a1a2e]/5 rounded-2xl p-4">
        <h4 className="text-[#c5a55a] font-semibold text-sm mb-3">Length Options</h4>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm border-collapse min-w-[400px]">
            <thead>
              <tr className="text-left">
                <Th>Size</Th>
                <Th>Short</Th>
                <Th>Regular</Th>
                <Th>Long</Th>
              </tr>
            </thead>
            <tbody>
              {KURTI_SIZES.map((r) => (
                <tr key={r.size} className="border-t border-white/5 hover:bg-[#1a1a2e]/5 transition-colors">
                  <td className="py-2 px-2 font-semibold text-[#c5a55a]">{r.size}</td>
                  <td className="py-2 px-2 text-[#1a1a2e]/70">{r.shortLen}</td>
                  <td className="py-2 px-2 text-[#1a1a2e]/70">{r.regLen}</td>
                  <td className="py-2 px-2 text-[#1a1a2e]/70">{r.longLen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LehengaTab() {
  return (
    <div className="space-y-4">
      <p className="text-[#1a1a2e]/50 text-xs">All measurements in inches.</p>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm border-collapse min-w-[400px]">
          <thead>
            <tr className="text-left">
              <Th>Size</Th>
              <Th>Waist</Th>
              <Th>Hip</Th>
              <Th>Length</Th>
              <Th>Can-Can</Th>
            </tr>
          </thead>
          <tbody>
            {LEHENGA_SIZES.map((r) => (
              <tr key={r.size} className="border-t border-white/5 hover:bg-[#1a1a2e]/5 transition-colors">
                <td className="py-2.5 px-2 font-semibold text-[#c5a55a]">{r.size}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.waist}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.hip}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.length}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{r.canCan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#c5a55a]/10 border border-[#c5a55a]/20 rounded-2xl p-4 text-sm text-[#1a1a2e]/70">
        <p className="font-medium text-[#c5a55a] mb-1">About Can-Can Layers</p>
        <p>Can-Can (net underskirt) gives the lehenga its flare and volume. More layers = more volume. Heavy lehengas usually need 2-3 layers for the perfect shape.</p>
      </div>
    </div>
  );
}

function BlouseTab({ unit, setUnit }: { unit: 'in' | 'cm'; setUnit: (u: 'in' | 'cm') => void }) {
  return (
    <div className="space-y-4">
      {/* Unit toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[#1a1a2e]/50 text-xs">Blouse measurements</p>
        <div className="flex bg-[#1a1a2e]/5 rounded-full p-0.5">
          <button
            onClick={() => setUnit('in')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
              unit === 'in' ? 'bg-[#c5a55a] text-white' : 'text-[#1a1a2e]/50 hover:text-white'
            }`}
          >
            Inches
          </button>
          <button
            onClick={() => setUnit('cm')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
              unit === 'cm' ? 'bg-[#c5a55a] text-white' : 'text-[#1a1a2e]/50 hover:text-white'
            }`}
          >
            CM
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm border-collapse min-w-[450px]">
          <thead>
            <tr className="text-left">
              <Th>Size</Th>
              <Th>Chest</Th>
              <Th>Shoulder</Th>
              <Th>Sleeve</Th>
              <Th>Back</Th>
            </tr>
          </thead>
          <tbody>
            {BLOUSE_SIZES.map((r) => (
              <tr key={r.size} className="border-t border-white/5 hover:bg-[#1a1a2e]/5 transition-colors">
                <td className="py-2.5 px-2 font-semibold text-[#c5a55a]">{r.size}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{unit === 'in' ? `${r.chest.in}"` : `${r.chest.cm}`}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{unit === 'in' ? `${r.shoulder.in}"` : `${r.shoulder.cm}`}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{unit === 'in' ? `${r.sleeve.in}"` : `${r.sleeve.cm}`}</td>
                <td className="py-2.5 px-2 text-[#1a1a2e]/70">{unit === 'in' ? `${r.back.in}"` : `${r.back.cm}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#c5a55a]/10 border border-[#c5a55a]/20 rounded-2xl p-4 text-sm text-[#1a1a2e]/70">
        <p className="font-medium text-[#c5a55a] mb-1">💡 Blouse Fitting Tip</p>
        <p>For a perfect fit, we recommend getting measured by a tailor. Our blouse pieces come unstitched — your tailor can customize the neckline, sleeve style, and back design.</p>
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1a1a2e]/5 rounded-xl p-3">
      <p className="text-[#1a1a2e]/40 text-xs mb-0.5">{label}</p>
      <p className="text-[#1a1a2e] font-medium text-sm">{value}</p>
    </div>
  );
}

function DrapeTip({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-[#1a1a2e]/5 rounded-xl p-3">
      <p className="text-[#1a1a2e] font-medium text-sm mb-1">{title}</p>
      <p className="text-[#1a1a2e]/50 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-2 px-2 text-xs font-semibold text-[#1a1a2e]/40 uppercase tracking-wider">
      {children}
    </th>
  );
}
