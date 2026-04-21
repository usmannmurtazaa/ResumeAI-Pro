import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiCreditCard, FiCheckCircle, FiAlertCircle, FiLoader,
  FiCalendar, FiDollarSign, FiStar, FiAward, FiShield,
  FiRefreshCw, FiExternalLink, FiChevronRight, FiInfo,
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Billing = () => {
  const navigate = useNavigate();
  const { user, isPremium, subscription, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '5 Resumes',
        'Basic Templates',
        'ATS Score Check',
        'PDF Download',
        '10 AI Suggestions',
      ],
      color: 'from-gray-500 to-gray-600',
      current: !isPremium,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: 'per month',
      features: [
        'Unlimited Resumes',
        'All Premium Templates',
        'Advanced ATS Scoring',
        'Priority PDF Export',
        'Unlimited AI Suggestions',
        'Cover Letter Builder',
        'Priority Support',
      ],
      color: 'from-purple-500 to-pink-500',
      current: isPremium,
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      price: '$49',
      period: 'per month',
      features: [
        'Everything in Pro',
        'Team Management',
        'Analytics Dashboard',
        'API Access',
        'Custom Branding',
        'Dedicated Support',
      ],
      color: 'from-blue-500 to-cyan-500',
      current: false,
    },
  ];

  const paymentMethods = [
    { id: 1, brand: 'visa', last4: '4242', expMonth: 12, expYear: 2026, isDefault: true },
  ];

  const billingHistory = [
    { id: 1, date: '2024-01-15', amount: '$19.00', status: 'paid', invoice: '#INV-2024-001' },
    { id: 2, date: '2023-12-15', amount: '$19.00', status: 'paid', invoice: '#INV-2023-012' },
    { id: 3, date: '2023-11-15', amount: '$19.00', status: 'paid', invoice: '#INV-2023-011' },
  ];

  const handleSubscribe = async (planId) => {
    if (planId === 'free') {
      navigate('/pricing');
      return;
    }

    setLoading(true);
    try {
      // Redirect to Stripe Checkout
      toast.success('Redirecting to checkout...');
      // In production: window.location.href = checkoutUrl
      setTimeout(() => {
        toast.success('Subscription activated! (Demo mode)');
        refreshUserData();
      }, 2000);
    } catch (error) {
      toast.error('Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Subscription canceled. Access continues until end of period.');
      setShowCancelModal(false);
      refreshUserData();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleResumeSubscription = async () => {
    setProcessingAction(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Subscription resumed!');
      setShowResumeModal(false);
      refreshUserData();
    } catch (error) {
      toast.error('Failed to resume subscription');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdatePayment = () => {
    toast.success('Redirecting to payment portal...');
    // In production: Redirect to Stripe Customer Portal
  };

  const handleDownloadInvoice = (invoice) => {
    toast.success(`Downloading ${invoice.invoice}...`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBrandIcon = (brand) => {
    const icons = { visa: '💳', mastercard: '💳', amex: '💳' };
    return icons[brand] || '💳';
  };

  return (
    <DashboardLayout title="Billing & Subscription" description="Manage your plan and payment methods">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Current Plan */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                className={`relative ${plan.current ? 'ring-2 ring-primary-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge variant="warning">Most Popular</Badge>
                  </div>
                )}
                <Card className="p-6 h-full">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.current ? (
                    <Badge variant="success" className="w-full justify-center py-2">
                      <FiCheckCircle className="w-4 h-4 mr-1" />
                      Current Plan
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      variant={plan.id === 'pro' ? 'primary' : 'outline'}
                      className="w-full"
                      disabled={loading}
                    >
                      {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subscription Details */}
        {isPremium && subscription && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-primary-500" />
              Subscription Details
            </h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium flex items-center gap-1">
                  <FiAward className="w-4 h-4 text-yellow-500" />
                  Pro Plan
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={subscription?.cancelAtPeriodEnd ? 'warning' : 'success'}>
                  {subscription?.cancelAtPeriodEnd ? 'Cancels at period end' : 'Active'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Billing Date</p>
                <p className="font-medium">
                  {subscription?.currentPeriodEnd 
                    ? formatDate(subscription.currentPeriodEnd)
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {subscription?.cancelAtPeriodEnd ? (
                <Button onClick={() => setShowResumeModal(true)} icon={<FiRefreshCw />}>
                  Resume Subscription
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setShowCancelModal(true)}>
                  Cancel Subscription
                </Button>
              )}
              <Button variant="ghost" onClick={handleUpdatePayment}>
                Update Payment Method
              </Button>
            </div>
          </Card>
        )}

        {/* Payment Methods */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiCreditCard className="w-5 h-5 text-primary-500" />
              Payment Methods
            </h3>
            <Button size="sm" variant="outline" onClick={handleUpdatePayment}>
              Add Payment Method
            </Button>
          </div>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getBrandIcon(method.brand)}</span>
                  <div>
                    <p className="font-medium capitalize">{method.brand} •••• {method.last4}</p>
                    <p className="text-xs text-gray-500">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                {method.isDefault && (
                  <Badge variant="success" size="sm">Default</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Billing History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiDollarSign className="w-5 h-5 text-primary-500" />
            Billing History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Invoice</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">{formatDate(item.date)}</td>
                    <td className="py-3 px-4">{item.amount}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm">{item.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{item.invoice}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(item)}
                        className="text-primary-500 hover:text-primary-600 text-sm"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Subscription"
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Keep Subscription
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelSubscription}
                loading={processingAction}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </Modal>

        {/* Resume Confirmation Modal */}
        <Modal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          title="Resume Subscription"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Resume your subscription to keep enjoying premium features.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowResumeModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleResumeSubscription} loading={processingAction}>
                Resume Subscription
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Billing;