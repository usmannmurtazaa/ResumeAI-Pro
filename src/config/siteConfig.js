export const siteConfig = {
  name: 'ATS Resume Builder',
  description: 'Create professional, ATS-optimized resumes that help you land your dream job',
  url: 'https://atsresumebuilder.netlify.app',
  ogImage: 'https://atsresumebuilder.com/og-image.jpg',
  links: {
    twitter: 'https://twitter.com/usmannmurtazaa',
    github: 'https://github.com/usmannmurtazaa',
    linkedin: 'https://linkedin.com/usmanmurtaza01'
  },
  contact: {
    email: 'usmanmurtazaportfolio@gmail.com',
    phone: '+92 319 0034982'
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