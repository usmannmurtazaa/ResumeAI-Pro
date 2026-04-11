export const siteConfig = {
  name: 'ResumeAi Pro',
  tagline: 'AI-Powered ATS Resume Builder',
  description: 'Create professional, ATS-optimized resumes with AI-powered suggestions. Land your dream job faster with ResumeAi Pro.',
  url: 'https://resumeaipro.netlify.app',
  ogImage: 'https://resumeai.pro/og-image.png',
  author: 'Usman Murtaza',
  authorLinks: {
    github: 'https://github.com/usmannmurtazaa',
    portfolio: 'https://usmanmurtaza.netlify.app',
    linkedin: 'https://linkedin.com/in/usmanmurtaza01'
  },
  links: {
    twitter: 'https://twitter.com/resumeaipro',
    github: 'https://github.com/usmannmurtazaa/resumeaipro'
  },
  contact: {
    email: 'support@resumeai.pro'
  },

  pricing: {
    free: {
      name: 'Free',
      price: 0,
      features: [
        '1 Resume',
        'Basic Templates',
        'PDF Download',
        'ATS Check'
      ]
    },
    pro: {
      name: 'Professional',
      price: 9.99,
      features: [
        'Unlimited Resumes',
        'All Templates',
        'Priority Support',
        'Advanced ATS Optimization',
        'LinkedIn Import',
        'Cover Letter Builder'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 29.99,
      features: [
        'Everything in Pro',
        'Team Management',
        'Custom Templates',
        'API Access',
        'Dedicated Support',
        'Custom Branding'
      ]
    }
  }
};