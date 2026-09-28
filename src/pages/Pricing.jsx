import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { FiCheck, FiArrowRight, FiLock, FiMail } from 'react-icons/fi';
import MainLayout from '../components/layouts/MainLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { siteConfig } from '../config/siteConfig';

// ── Constants ─────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started',
    features: ['5 Resumes', 'Basic Templates', 'ATS Score Check', 'PDF Download', 'Email Support'],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Professional',
    monthlyPrice: 19.99,
    yearlyPrice: 13.99,
    description: 'For serious job seekers',
    features: [
      'Unlimited Resumes',
      'Premium Templates',
      'AI-Powered Suggestions',
      'Advanced ATS Optimization',
      'Cover Letter Builder',
      'LinkedIn Import',
      'Priority Support',
    ],
    cta: 'Get Professional',
    popular: true,
  },
  {
    name: 'Business',
    monthlyPrice: 49.99,
    yearlyPrice: 34.99,
    description: 'For teams and agencies',
    features: [
      'Everything in Professional',
      'Team Management',
      'Analytics Dashboard',
      'API Access',
      'Custom Branding',
      'Dedicated Support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel anytime from your account settings. Your access continues until the end of your current billing period.',
  },
  {
    q: 'Do you have a free plan?',
    a: 'Yes. The Free plan is free forever and includes 5 resumes, basic templates, ATS score check, and PDF download. No credit card required.',
  },
  {
    q: 'Are the templates ATS-friendly?',
    a: 'Yes. Every template is designed and tested to pass applicant tracking systems used by major employers.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. Upgrade or downgrade anytime. Upgrades take effect immediately; downgrades apply at your next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Visa, Mastercard, and American Express through Stripe. All transactions are encrypted in transit.',
  },
  {
    q: 'Can I try before paying?',
    a: 'Yes. Start with the Free plan - no credit card needed. Upgrade to a paid plan only when you are ready.',
  },
];

// ── Structured Data ───────────────────────────────────────────────────────

const PRODUCT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Maniesta Career OS',
  description:
    'AI-powered ATS resume builder with professional templates and real-time optimisation.',
  brand: {
    '@type': 'Brand',
    name: 'Maniesta Career OS',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    highPrice: '49.99',
    offerCount: '3',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Professional',
        price: '19.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Business',
        price: '49.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    ],
  },
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};

// ── Component ─────────────────────────────────────────────────────────────

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleCTA = useCallback(
    (planName) => {
      if (planName === 'Business') {
        window.location.href = `mailto:${siteConfig.contact.email}?subject=Business%20Plan%20Inquiry`;
      } else if (planName === 'Free') {
        navigate(user ? '/dashboard' : '/signup');
      } else {
        navigate('/signup');
      }
    },
    [navigate, user]
  );

  return (
    <MainLayout>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(PRODUCT_SCHEMA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-8"
          >
            <Badge variant="primary" className="mb-4">
              Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your career journey. All plans include core ATS
              optimization.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className={cn(
                'text-sm font-medium',
                !isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'
              )}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              aria-label="Toggle billing period"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isYearly ? 'translate-x-7' : 'translate-x-0'}`}
              />
            </button>
            <span
              className={cn(
                'text-sm font-medium',
                isYearly ? 'text-gray-900 dark:text-white' : 'text-gray-500'
              )}
            >
              Yearly
              <span className="ml-1 text-green-500 text-xs font-semibold">Save 30%</span>
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {PLANS.map((plan, index) => {
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const isFree = price === 0;
              const isBusiness = plan.name === 'Business';

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={cn(
                      'relative p-8 h-full flex flex-col',
                      plan.popular ? 'ring-2 ring-primary-500 shadow-lg' : ''
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge variant="warning" className="shadow-md">
                          Recommended
                        </Badge>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {plan.description}
                      </p>

                      <div className="flex items-end justify-center gap-1">
                        {isFree ? (
                          <span className="text-5xl font-bold text-gray-900 dark:text-white">
                            Free
                          </span>
                        ) : (
                          <>
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">
                              ${price}
                            </span>
                            <span className="text-gray-500 mb-1.5 text-sm">/month</span>
                          </>
                        )}
                      </div>
                      {isYearly && !isFree && (
                        <p className="text-xs text-green-500 mt-1">
                          Billed ${(plan.yearlyPrice * 12).toFixed(2)}/year
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className={cn(
                        'w-full',
                        plan.popular && 'bg-gradient-to-r from-primary-500 to-accent-500'
                      )}
                      size="lg"
                      onClick={() => handleCTA(plan.name)}
                      icon={isBusiness ? <FiMail /> : <FiArrowRight />}
                    >
                      {plan.cta}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Bar */}
          <div className="text-center mb-20">
            <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2 flex-wrap">
              <FiLock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>
                Secure checkout via Stripe.
                <span className="mx-2">•</span>
                No hidden fees. Cancel anytime.
              </span>
            </p>
          </div>

          {/* FAQ */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FAQS.map((faq, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Business CTA */}
          <div className="mt-16 text-center">
            <Card className="p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20 inline-block mx-auto max-w-2xl">
              <h3 className="text-xl font-semibold mb-2">Need a custom plan?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Contact us for volume pricing, custom integrations, and dedicated support.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = `mailto:${siteConfig.contact.email}?subject=Custom%20Plan%20Inquiry`)
                }
                variant="outline"
                icon={<FiMail />}
              >
                Contact Sales
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Pricing;
