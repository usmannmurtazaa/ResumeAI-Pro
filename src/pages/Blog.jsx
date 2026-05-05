import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiCalendar, FiUser, FiTag, FiClock, FiTrendingUp,
  FiSearch, FiChevronRight, FiBookOpen,
  FiStar, FiHeart, FiArrowRight,
  FiCheckCircle, FiZap, FiTarget, FiBriefcase,
  FiMessageCircle, FiFileText, FiAlertCircle,
} from 'react-icons/fi';
	import MainLayout from '../components/layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import { usePageTitle } from '../hooks/useDocumentTitle';
import { BLOG_POSTS } from '../data/blogPosts';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', name: 'All Posts', icon: FiBookOpen },
  { id: 'resume-tips', name: 'Resume Tips', icon: FiFileText },
  { id: 'career-advice', name: 'Career Advice', icon: FiBriefcase },
  { id: 'job-search', name: 'Job Search', icon: FiTarget },
  { id: 'ats-guide', name: 'ATS Guide', icon: FiZap },
  { id: 'interview-prep', name: 'Interview Prep', icon: FiMessageCircle },
];

const POPULAR_TAGS = [
  'Resume Tips', 'ATS Optimization', 'Interview Prep', 'Career Growth',
  'Job Search', 'Networking', 'Cover Letter', 'LinkedIn Profile',
  'Salary Negotiation', 'Remote Work',
];

// ── Utilities ────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatViews = (views) => {
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
  return views.toString();
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// ── Blog Card Component ──────────────────────────────────────────────────

const BlogCard = React.memo(({ post }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <Link to={`/blog/${post.slug}`} className="block h-full group">
      <Card className="h-full hover:shadow-xl transition-all">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 h-48 flex items-center justify-center rounded-t-xl">
          <span className="text-6xl group-hover:scale-110 transition-transform">{post.coverImage}</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" size="sm">
              {CATEGORIES.find(c => c.id === post.category)?.name || post.category}
            </Badge>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FiClock className="w-3 h-3" />{post.readTime}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name={post.author.avatar} size="sm" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <span className="flex items-center gap-1 text-xs"><FiStar className="w-3 h-3" />{formatViews(post.views)}</span>
              <span className="flex items-center gap-1 text-xs"><FiHeart className="w-3 h-3" />{post.likes}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  </motion.div>
));

BlogCard.displayName = 'BlogCard';

// ── Main Component ────────────────────────────────────────────────────────

const Blog = () => {
  usePageTitle({
    title: 'Blog - Resume Tips & Career Advice',
    description: 'Expert resume tips, career advice, and job search strategies to accelerate your career growth.',
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // ── Filtered Posts ──────────────────────────────────────────────────

  // FIXED: Clearer filter logic
  const { featuredPost, gridPosts } = useMemo(() => {
    const featured = BLOG_POSTS.find(post => post.featured);
    
    const filtered = BLOG_POSTS.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Show featured only on main page (all categories, no search)
    const showFeatured = selectedCategory === 'all' && !searchTerm && featured;
    
    // Remove featured from grid when showing it separately
    const grid = showFeatured 
      ? filtered.filter(post => post.id !== featured.id)
      : filtered;

    return { featuredPost: showFeatured ? featured : null, gridPosts: grid };
  }, [selectedCategory, searchTerm]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSubscribe = useCallback((e) => {
    e.preventDefault();
    
    if (!email.trim() || !isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubscribed(true);
      setEmail('');
      setIsSubscribing(false);
      toast.success('Thanks for subscribing! Check your inbox.');
    }, 1000);
  }, [email]);

  const handleTagClick = useCallback((tag) => {
    setSearchTerm(tag);
    setSelectedCategory('all');
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <Badge variant="primary" className="mb-4">Insights & Resources</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Master Your Career with <span className="gradient-text">Expert Advice</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Actionable tips, industry insights, and proven strategies to accelerate your career growth.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {CATEGORIES.map(category => (
                <button key={category.id} onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  <category.icon className="w-4 h-4" />{category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Post */}
          {featuredPost && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }} className="max-w-5xl mx-auto mb-12">
              <Link to={`/blog/${featuredPost.slug}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-8 flex items-center justify-center">
                      <span className="text-8xl">{featuredPost.coverImage}</span>
                    </div>
                    <div className="p-6 md:p-8">
                      <Badge variant="warning" className="mb-3">Featured Post</Badge>
                      <h2 className="text-2xl md:text-3xl font-bold mb-3">{featuredPost.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={featuredPost.author.avatar} size="sm" />
                          <span className="text-sm font-medium">{featuredPost.author.name}</span>
                        </div>
                        <span className="text-sm text-gray-500"><FiCalendar className="w-3 h-3 inline mr-1" />{formatDate(featuredPost.publishedAt)}</span>
                        <span className="text-sm text-gray-500"><FiClock className="w-3 h-3 inline mr-1" />{featuredPost.readTime}</span>
                      </div>
                      <Button icon={<FiArrowRight />}>Read Article</Button>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* Blog Posts Grid */}
          {gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {gridPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}>
                View All Posts
              </Button>
            </div>
          )}

          {/* Newsletter */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }} className="max-w-4xl mx-auto mt-16">
            <Card className="p-8 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Get Career Insights Straight to Your Inbox</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Join 50,000+ professionals receiving weekly career tips and resume advice.
                </p>
                {subscribed ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-green-600 dark:text-green-400">
                    <FiCheckCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-lg font-medium">Thanks for subscribing!</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                    <Input type="email" placeholder="Enter your email" value={email}
                      onChange={e => setEmail(e.target.value)} className="flex-1" required />
                    <Button type="submit" loading={isSubscribing}>Subscribe</Button>
                  </form>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Popular Tags */}
          <div className="max-w-4xl mx-auto mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">Popular Topics</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_TAGS.map(tag => (
                <button key={tag} onClick={() => handleTagClick(tag)}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Blog;
