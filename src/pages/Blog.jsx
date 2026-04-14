import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, FiUser, FiTag, FiClock, FiTrendingUp,
  FiSearch, FiFilter, FiChevronRight, FiBookOpen,
  FiStar, FiHeart, FiShare2, FiBookmark, FiEye,
  FiArrowRight, FiZap, FiTarget, FiAward, FiBriefcase,
  FiCode, FiLayout, FiMessageCircle, FiThumbsUp
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Blog = () => {
  useDocumentTitle('Blog - Resume Tips & Career Advice | ResumeAI Pro');
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const categories = [
    { id: 'all', name: 'All Posts', icon: FiBookOpen },
    { id: 'resume-tips', name: 'Resume Tips', icon: FiFileText },
    { id: 'career-advice', name: 'Career Advice', icon: FiBriefcase },
    { id: 'job-search', name: 'Job Search', icon: FiTarget },
    { id: 'ats-guide', name: 'ATS Guide', icon: FiZap },
    { id: 'interview-prep', name: 'Interview Prep', icon: FiMessageCircle }
  ];

  const blogPosts = [
    {
      id: 1,
      title: '10 Resume Mistakes That Are Costing You Interviews',
      excerpt: 'Discover the most common resume mistakes and how to fix them to increase your chances of landing interviews.',
      content: '',
      category: 'resume-tips',
      author: {
        name: 'Sarah Chen',
        avatar: 'SC',
        role: 'Career Coach'
      },
      coverImage: '📄',
      readTime: '6 min read',
      publishedAt: '2024-01-15',
      tags: ['Resume', 'Job Search', 'Career'],
      featured: true,
      views: 12453,
      likes: 342
    },
    {
      id: 2,
      title: 'How to Optimize Your Resume for ATS Systems in 2025',
      excerpt: 'Learn the latest strategies to ensure your resume passes through Applicant Tracking Systems and reaches human recruiters.',
      content: '',
      category: 'ats-guide',
      author: {
        name: 'Usman Murtaza',
        avatar: 'UM',
        role: 'Founder & CEO'
      },
      coverImage: '🤖',
      readTime: '8 min read',
      publishedAt: '2024-01-10',
      tags: ['ATS', 'Resume Optimization', 'Job Search'],
      featured: true,
      views: 18934,
      likes: 567
    },
    {
      id: 3,
      title: 'The Ultimate Guide to Writing Achievement-Based Resume Bullets',
      excerpt: 'Transform your resume from a list of duties to a compelling story of achievements with these proven techniques.',
      content: '',
      category: 'resume-tips',
      author: {
        name: 'Michael Rodriguez',
        avatar: 'MR',
        role: 'Senior Recruiter'
      },
      coverImage: '🎯',
      readTime: '7 min read',
      publishedAt: '2024-01-05',
      tags: ['Resume Writing', 'Achievements', 'Career'],
      featured: false,
      views: 8765,
      likes: 234
    },
    {
      id: 4,
      title: 'Top 20 Action Verbs That Will Make Your Resume Stand Out',
      excerpt: 'Powerful action verbs that grab attention and showcase your accomplishments effectively.',
      content: '',
      category: 'resume-tips',
      author: {
        name: 'Emily Watson',
        avatar: 'EW',
        role: 'Content Strategist'
      },
      coverImage: '⚡',
      readTime: '5 min read',
      publishedAt: '2024-01-01',
      tags: ['Resume Tips', 'Writing', 'Keywords'],
      featured: false,
      views: 6543,
      likes: 189
    },
    {
      id: 5,
      title: 'How to Write a Cover Letter That Complements Your Resume',
      excerpt: 'Learn how to craft a compelling cover letter that works in harmony with your resume to land more interviews.',
      content: '',
      category: 'career-advice',
      author: {
        name: 'David Kim',
        avatar: 'DK',
        role: 'HR Director'
      },
      coverImage: '📝',
      readTime: '6 min read',
      publishedAt: '2023-12-28',
      tags: ['Cover Letter', 'Job Application', 'Career'],
      featured: false,
      views: 5432,
      likes: 156
    },
    {
      id: 6,
      title: 'Networking Strategies That Actually Work in 2025',
      excerpt: 'Modern networking techniques to build meaningful professional relationships and uncover hidden job opportunities.',
      content: '',
      category: 'job-search',
      author: {
        name: 'Jessica Lee',
        avatar: 'JL',
        role: 'Career Strategist'
      },
      coverImage: '🤝',
      readTime: '7 min read',
      publishedAt: '2023-12-20',
      tags: ['Networking', 'Job Search', 'Career Growth'],
      featured: false,
      views: 4321,
      likes: 123
    }
  ];

  const featuredPost = blogPosts.find(post => post.featured);

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <Badge variant="primary" className="mb-4">Insights & Resources</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Master Your Career with{' '}
              <span className="gradient-text">Expert Advice</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Actionable tips, industry insights, and proven strategies to accelerate your career growth.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Post */}
          {featuredPost && selectedCategory === 'all' && !searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-5xl mx-auto mb-12"
            >
              <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-8 flex items-center justify-center">
                    <span className="text-8xl">{featuredPost.coverImage}</span>
                  </div>
                  <div className="p-6 md:p-8">
                    <Badge variant="warning" className="mb-3">Featured Post</Badge>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={featuredPost.author.avatar} size="sm" />
                        <span className="text-sm font-medium">{featuredPost.author.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        {formatDate(featuredPost.publishedAt)}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <Button icon={<FiArrowRight />}>
                      Read Article
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredPosts.filter(p => !p.featured || selectedCategory !== 'all' || searchTerm).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-xl transition-all group">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 h-48 flex items-center justify-center">
                    <span className="text-6xl group-hover:scale-110 transition-transform">
                      {post.coverImage}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" size="sm">
                        {categories.find(c => c.id === post.category)?.name}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={post.author.avatar} size="sm" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {post.author.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <span className="flex items-center gap-1 text-xs">
                          <FiEye className="w-3 h-3" />
                          {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <FiHeart className="w-3 h-3" />
                          {post.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <FiBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Newsletter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mt-16"
          >
            <Card className="p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Get Career Insights Straight to Your Inbox
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Join 50,000+ professionals receiving weekly career tips and resume advice.
                </p>
                
                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-green-600 dark:text-green-400"
                  >
                    <FiCheckCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-lg font-medium">Thanks for subscribing!</p>
                    <p className="text-sm">Check your inbox for confirmation.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button type="submit">
                      Subscribe
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Popular Tags */}
          <div className="max-w-4xl mx-auto mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">Popular Topics</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {['Resume Tips', 'ATS Optimization', 'Interview Prep', 'Career Growth', 
                'Job Search', 'Networking', 'Cover Letter', 'LinkedIn Profile', 
                'Salary Negotiation', 'Remote Work'].map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// FiFileText icon component (if not imported)
const FiFileText = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default Blog;