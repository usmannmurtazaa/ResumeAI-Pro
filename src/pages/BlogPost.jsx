import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, FiUser, FiClock,
  FiStar, FiHeart, FiShare2, FiBookmark, FiEye,
  FiArrowLeft, FiTwitter, FiLinkedin, FiFacebook,
  FiLink, FiThumbsUp, FiMessageCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Loader from '../components/common/Loader';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import { BLOG_POSTS } from '../data/blogPosts'; // FIXED: Shared data file

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

// ── Related Posts Component ──────────────────────────────────────────────

const RelatedPostCard = React.memo(({ post }) => (
  <Link to={`/blog/${post.slug}`} className="block h-full group">
    <Card className="h-full hover:shadow-xl transition-all">
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 h-40 flex items-center justify-center rounded-t-xl">
        <span className="text-5xl group-hover:scale-110 transition-transform">{post.coverImage}</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-500"><FiClock className="w-3 h-3 inline mr-1" />{post.readTime}</p>
      </div>
    </Card>
  </Link>
));

RelatedPostCard.displayName = 'RelatedPostCard';

// ── Main Component ────────────────────────────────────────────────────────

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState([
    { id: 1, author: 'John Smith', avatar: 'JS', content: 'This is incredibly helpful!', date: '2 days ago', likes: 12 },
    { id: 2, author: 'Maria Garcia', avatar: 'MG', content: 'The STAR method section was exactly what I needed.', date: '1 day ago', likes: 8 },
  ]);

  // Set page title
  usePageTitle({
    title: post ? `${post.title}` : 'Blog Post',
    description: post?.excerpt || 'Read our latest blog post',
  });

  // ── Load post ────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);

    // FIXED: Simulate async fetch
    const timer = setTimeout(() => {
      const foundPost = BLOG_POSTS.find(p => p.slug === slug);
      
      if (foundPost) {
        setPost(foundPost);
        setRelatedPosts(
          BLOG_POSTS.filter(p => p.category === foundPost.category && p.id !== foundPost.id).slice(0, 3)
        );
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [slug]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleLike = useCallback(() => {
    setLiked(prev => !prev);
    toast.success(liked ? 'Removed like' : 'Post liked!', { duration: 2000 });
  }, [liked]);

  const handleBookmark = useCallback(() => {
    setBookmarked(prev => !prev);
    toast.success(bookmarked ? 'Removed bookmark' : 'Post bookmarked!', { duration: 2000 });
  }, [bookmarked]);

  const handleShare = useCallback(async (platform) => {
    const url = window.location.href;
    const text = post?.title || '';

    // Try native share first (mobile)
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: text, url });
        setShowShareMenu(false);
        return;
      } catch {}
    }

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      } catch {
        toast.error('Failed to copy link');
      }
    }
    setShowShareMenu(false);
  }, [post]);

  const handleCommentSubmit = useCallback((e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmittingComment(true);

    // Simulate API call
    setTimeout(() => {
      setComments(prev => [{
        id: Date.now(),
        author: 'You',
        avatar: 'YO',
        content: comment,
        date: 'Just now',
        likes: 0,
      }, ...prev]);
      setComment('');
      setIsSubmittingComment(false);
      toast.success('Comment posted!');
    }, 500);
  }, [comment]);

  // ── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
          <Loader variant="brand" size="lg" text="Loading article..." />
        </div>
      </MainLayout>
    );
  }

  // ── Not Found State ──────────────────────────────────────────────────

  if (!post) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Post Not Found</h1>
            <p className="text-gray-500 mb-6">The article you're looking for doesn't exist or has been moved.</p>
            <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button onClick={() => navigate('/blog')}
              className="flex items-center gap-2 text-gray-500 hover:text-primary-500 mb-6 transition-colors text-sm">
              <FiArrowLeft className="w-4 h-4" /> Back to Blog
            </button>

            {/* Article Header */}
            <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
              <Badge variant="primary" className="mb-4">{post.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{post.title}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">{post.excerpt}</p>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <Avatar name={post.author.avatar} size="lg" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{post.author.name}</p>
                    <p className="text-sm text-gray-500">{post.author.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span><FiCalendar className="w-4 h-4 inline mr-1" />{formatDate(post.publishedAt)}</span>
                  <span><FiClock className="w-4 h-4 inline mr-1" />{post.readTime}</span>
                  <span><FiEye className="w-4 h-4 inline mr-1" />{formatViews(post.views)}</span>
                </div>
              </div>
            </motion.header>

            {/* Article Content */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="prose prose-lg dark:prose-invert max-w-none mb-8">
              {/* Article content */}
              <div 
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </motion.div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex items-center gap-2">
                <button onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                    liked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 hover:text-red-500'
                  }`}>
                  <FiHeart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  <span>{liked ? post.likes + 1 : post.likes}</span>
                </button>
                <button onClick={handleBookmark}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                    bookmarked ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 hover:text-primary-500'
                  }`}>
                  <FiBookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                  <span>{bookmarked ? 'Saved' : 'Save'}</span>
                </button>
              </div>
              
              {/* Share Menu */}
              <div className="relative">
                <button onClick={() => setShowShareMenu(prev => !prev)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-primary-500 rounded-lg transition-colors text-sm">
                  <FiShare2 className="w-5 h-5" /> Share
                </button>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-2">
                      {[
                        { platform: 'twitter', icon: FiTwitter, label: 'Twitter', className: 'text-blue-400' },
                        { platform: 'linkedin', icon: FiLinkedin, label: 'LinkedIn', className: 'text-blue-600' },
                        { platform: 'facebook', icon: FiFacebook, label: 'Facebook', className: 'text-blue-500' },
                        { platform: 'copy', icon: FiLink, label: 'Copy Link' },
                      ].map(({ platform, icon: Icon, label, className }) => (
                        <button key={platform} onClick={() => handleShare(platform)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                          <Icon className={`w-4 h-4 ${className || ''}`} />{label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Author Bio */}
            <Card className="p-6 mb-12">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar name={post.author.avatar} size="xl" />
                <div>
                  <h3 className="text-xl font-bold mb-1">{post.author.name}</h3>
                  <p className="text-primary-600 dark:text-primary-400 mb-3">{post.author.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{post.author.bio}</p>
                </div>
              </div>
            </Card>

            {/* Comments */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>
              
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex gap-3">
                  <Avatar name="YO" size="md" />
                  <div className="flex-1">
                    <textarea value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Share your thoughts..." rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm"
                      disabled={isSubmittingComment} />
                    <div className="flex justify-end mt-2">
                      <Button type="submit" disabled={!comment.trim()} loading={isSubmittingComment}>
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
              
              <div className="space-y-4">
                {comments.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                    <Avatar name={c.avatar} size="md" />
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{c.author}</span>
                          <span className="text-xs text-gray-500">{c.date}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{c.content}</p>
                      </div>
                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500 mt-1 ml-1">
                        <FiThumbsUp className="w-3 h-3" />{c.likes}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map(post => (
                    <RelatedPostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </MainLayout>
  );
};

export default BlogPost;
