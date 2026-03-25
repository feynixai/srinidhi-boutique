'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'hi';

const translations = {
  en: {
    home: 'Home',
    shop: 'Shop',
    search: 'Search',
    cart: 'Cart',
    wishlist: 'Wishlist',
    myOrders: 'My Orders',
    checkout: 'Checkout',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    quickAdd: 'Quick Add',
    outOfStock: 'Out of Stock',
    onlyLeft: (n: number) => `Only ${n} left!`,
    trending: 'Trending',
    peopleBought: (n: number) => `${n} people bought this week`,
    bestSeller: 'Best Seller',
    viewAll: 'View All',
    addToCompare: 'Compare',
    removeFromCompare: 'Remove',
    compareProducts: 'Compare Products',
    clearAll: 'Clear All',
    blog: 'Blog',
    offers: 'Offers',
    footer: {
      quickLinks: 'Quick Links',
      customerCare: 'Customer Care',
      followUs: 'Follow Us',
      allRights: 'All rights reserved.',
    },
    nav: {
      sarees: 'Sarees',
      kurtis: 'Kurtis',
      lehengas: 'Lehengas',
      blouses: 'Blouses',
      accessories: 'Accessories',
    },
  },
  hi: {
    home: 'होम',
    shop: 'दुकान',
    search: 'खोजें',
    cart: 'कार्ट',
    wishlist: 'इच्छा सूची',
    myOrders: 'मेरे ऑर्डर',
    checkout: 'चेकआउट',
    addToCart: 'कार्ट में डालें',
    buyNow: 'अभी खरीदें',
    quickAdd: 'जोड़ें',
    outOfStock: 'स्टॉक खत्म',
    onlyLeft: (n: number) => `केवल ${n} बचे!`,
    trending: 'ट्रेंडिंग',
    peopleBought: (n: number) => `${n} लोगों ने इस सप्ताह खरीदा`,
    bestSeller: 'बेस्ट सेलर',
    viewAll: 'सभी देखें',
    addToCompare: 'तुलना करें',
    removeFromCompare: 'हटाएं',
    compareProducts: 'उत्पाद तुलना',
    clearAll: 'सब हटाएं',
    blog: 'ब्लॉग',
    offers: 'ऑफर',
    footer: {
      quickLinks: 'त्वरित लिंक',
      customerCare: 'ग्राहक सेवा',
      followUs: 'हमें फॉलो करें',
      allRights: 'सर्वाधिकार सुरक्षित।',
    },
    nav: {
      sarees: 'साड़ी',
      kurtis: 'कुर्ती',
      lehengas: 'लहंगा',
      blouses: 'ब्लाउज',
      accessories: 'सहायक',
    },
  },
};

type Translations = typeof translations.en;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('sb_lang') as Lang | null;
    if (stored === 'hi' || stored === 'en') setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('sb_lang', l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
