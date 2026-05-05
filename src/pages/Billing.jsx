import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCreditCard, FiCheckCircle, FiCalendar, FiDollarSign,
  FiAward, FiRefreshCw, FiExternalLink, FiChevronRight,
  FiAlertCircle, FiShield, FiStar,
} from 'react-icons/fi';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['5 Resumes', 'Basic Templates', 'ATS Score Check', 'PDF Download', '10 AI Suggestions'],
    color: 'from-gray-500 to-gray-600',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: 'per month',
    features: ['Unlimited Resumes', 'All Premium Templates', 'Advanced ATS Scoring', 'Priority PDF Export', 'Unlimited AI Suggestions', 'Cover Letter Builder', 'Priority Support'],
    color: 'from-purple-500 to-pink-500',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$49',
    period: 'per month',
    features: ['Everything in Pro', 'Team Management', 'Analytics Dashboard', 'API Access', 'Custom Branding', 'Dedicated Support'],
    color: 'from-blue-500 to-cyan-500',
  },
];

// ── Loading Skeleton ──────────────────────────────────────────────────────

const BillingSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      ))}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────

const Billing = () => {
  const navigate = useNavigate();
  const { user, isPremium, subscription, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const mountedRef = useRef(true);

  // Set page title
  usePageTitle({
    title: 'Billing & Subscription',
    description: 'Manage your ResumeAI Pro plan, payment methods, and billing history.',
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Derived data ────────────────────────────────────────────────────

  const currentPlan = useMemo(() => {
    return isPremium ? 'pro' : 'free';
  }, [isPremium]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSubscribe = async (planId) => {
    if (planId === 'free') {
      navigate('/pricing');
      return;
    }

    setLoading(true);
    try {
      // FIXED: In production, redirect to Stripe Checkout
      // const response = await createCheckoutSession(planId);
      // window.location.href = response.url;
      
      toast.success('Redirecting to secure checkout...', { icon: '🔒' });
      
      // Simulate for demo
      setTimeout(() => {
        if (mountedRef.current) {
          toast.success('Subscription activated! (Demo)');
          refreshUserData?.();
          setLoading(false);
        }
      }, 1500);
    } catch (error) {
      if (mountedRef.current) {
        toast.error('Failed to process subscription');
        setLoading(false);
      }
    }
  };

  const handleCancelSubscription = async () => {
    setProcessingAction(true);
    try {
      // FIXED: In production, call API
      // await cancelSubscription();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (mountedRef.current) {
        toast.success('Subscription will cancel at end of billing period');
        setShowCancelModal(false);
        refreshUserData?.();
      }
    } catch {
      if (mountedRef.current) toast.error('Failed to cancel subscription');
    } finally {
      if (mountedRef.current) setProcessingAction(false);
    }
  };

  const handleResumeSubscription = async () => {
    setProcessingAction(true);
    try {
      // FIXED: In production, call API
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (mountedRef.current) {
        toast.success('Subscription resumed!');
        setShowResumeModal(false);
        refreshUserData?.();
      }
    } catch {
      if (mountedRef.current) toast.error('Failed to resume subscription');
    } finally {
      if (mountedRef.current) setProcessingAction(false);
    }
  };

  const handleUpdatePayment = () => {
    // FIXED: In production, redirect to Stripe Customer Portal
    // window.location.href = customerPortalUrl;
    toast.success('Redirecting to payment portal...', { icon: '💳' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <DashboardLayout title="Billing & Subscription" description="Manage your plan and payment methods" showWelcome={false}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Current Plan */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Current Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan;

              return (
                <motion.div key={plan.id} whileHover={{ y: -4 }}
                  className={`relative ${isCurrent ? 'ring-2 ring-primary-500 rounded-xl' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="warning">Most Popular</Badge>
                    </div>
                  )}
                  <Card className="p-6 h-full">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-500 text-sm">/{plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{feature}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Badge variant="success" className="w-full justify-center py-2">
                        <FiCheckCircle className="w-4 h-4 mr-1" />Current Plan
                      </Badge>
                    ) : (
                      <Button onClick={() => handleSubscribe(plan.id)}
                        variant={plan.id === 'pro' ? 'primary' : 'outline'}
                        className="w-full" disabled={loading}
                      >
                        {plan.id === 'free' ? 'Switch to Free' : `Upgrade to ${plan.name}`}
                      </Button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Subscription Details (if premium) */}
        {isPremium && subscription && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-primary-500" />Subscription Details
            </h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium flex items-center gap-1">
                  <FiAward className="w-4 h-4 text-yellow-500" />Pro Plan
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={subscription?.cancelAtPeriodEnd ? 'warning' : 'success'}>
                  {subscription?.cancelAtPeriodEnd ? 'Cancels at period end' : 'Active'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Billing</p>
                <p className="font-medium">{formatDate(subscription?.currentPeriodEnd)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {subscription?.cancelAtPeriodEnd ? (
                <Button onClick={() => setShowResumeModal(true)} icon={<FiRefreshCw />}>Resume Subscription</Button>
              ) : (
                <Button variant="outline" onClick={() => setShowCancelModal(true)}>Cancel Subscription</Button>
              )}
              <Button variant="ghost" onClick={handleUpdatePayment}>Update Payment Method</Button>
            </div>
          </Card>
        )}

        {/* Free Plan Upgrade Prompt */}
        {!isPremium && (
          <Card className="p-6 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <FiAward className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unlock premium templates, unlimited resumes, and advanced features</p>
                </div>
              </div>
              <Link to="/pricing">
                <Button className="bg-gradient-to-r from-primary-500 to-accent-500">
                  View Plans <FiChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Cancel Modal */}
        <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Subscription" size="sm">
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  You'll lose access to premium features at the end of your billing period.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep Subscription</Button>
              <Button variant="danger" onClick={handleCancelSubscription} loading={processingAction}>Cancel</Button>
            </div>
          </div>
        </Modal>

        {/* Resume Modal */}
        <Modal isOpen={showResumeModal} onClose={() => setShowResumeModal(false)} title="Resume Subscription" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Resume your subscription to keep enjoying premium features.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowResumeModal(false)}>Cancel</Button>
              <Button onClick={handleResumeSubscription} loading={processingAction}>Resume</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
