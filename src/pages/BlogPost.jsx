import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, FiUser, FiTag, FiClock, FiTrendingUp,
  FiSearch, FiFilter, FiChevronRight, FiBookOpen,
  FiStar, FiHeart, FiShare2, FiBookmark, FiEye,
  FiArrowRight, FiZap, FiTarget, FiAward, FiBriefcase,
  FiCode, FiLayout, FiMessageCircle, FiThumbsUp,
  FiArrowLeft, FiTwitter, FiLinkedin, FiFacebook,
  FiLink, FiCheckCircle, FiAlertCircle, FiCopy,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Loader from '../components/common/Loader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// Blog post data (same as in Blog.jsx)
const blogPosts = [
  {
    id: 1,
    slug: '10-resume-mistakes-costing-interviews',
    title: '10 Resume Mistakes That Are Costing You Interviews',
    excerpt: 'Discover the most common resume mistakes and how to fix them to increase your chances of landing interviews.',
    content: `
      <p class="lead">Your resume is often your first impression with a potential employer. Yet, many qualified candidates are being filtered out before a human ever sees their application. Here are the 10 most common resume mistakes and how to fix them.</p>
      
      <h2>1. Using an Unprofessional Email Address</h2>
      <p>Your email address should be simple and professional. Avoid nicknames, birth years, or inappropriate words. <strong>Solution:</strong> Create a free Gmail account with your first and last name.</p>
      
      <h2>2. Including an Objective Statement</h2>
      <p>Objective statements are outdated and focus on what you want, not what you can offer. <strong>Solution:</strong> Replace with a professional summary that highlights your value proposition.</p>
      
      <h2>3. Listing Job Duties Instead of Achievements</h2>
      <p>Recruiters want to see results, not a list of responsibilities. <strong>Solution:</strong> Use the STAR method (Situation, Task, Action, Result) to showcase your accomplishments with quantifiable metrics.</p>
      
      <h2>4. Using a Generic Template</h2>
      <p>Your resume should be tailored to each position you apply for. <strong>Solution:</strong> Customize your resume keywords and experiences to match the job description.</p>
      
      <h2>5. Including Outdated or Irrelevant Experience</h2>
      <p>Focus on the last 10-15 years of relevant experience. <strong>Solution:</strong> Remove high school details if you have a college degree, and eliminate outdated technical skills.</p>
      
      <h2>6. Poor Formatting and Inconsistent Styling</h2>
      <p>Inconsistent fonts, spacing, and formatting make your resume look unprofessional. <strong>Solution:</strong> Use a clean, ATS-friendly template with consistent formatting throughout.</p>
      
      <h2>7. Spelling and Grammar Errors</h2>
      <p>Typos suggest a lack of attention to detail. <strong>Solution:</strong> Use spell-check tools, read your resume aloud, and have someone else review it.</p>
      
      <h2>8. Missing Keywords for ATS</h2>
      <p>Applicant Tracking Systems scan for specific keywords. <strong>Solution:</strong> Use ResumeAI Pro's ATS Scanner to identify missing keywords from your target job description.</p>
      
      <h2>9. Including Personal Information</h2>
      <p>Never include your photo, age, marital status, religion, or social security number. <strong>Solution:</strong> Stick to professional contact information only.</p>
      
      <h2>10. Submitting as a Word Document</h2>
      <p>Word documents can lose formatting across different systems. <strong>Solution:</strong> Always submit your resume as a PDF unless otherwise specified.</p>
      
      <h2>Conclusion</h2>
      <p>Avoiding these common mistakes will significantly improve your chances of getting past ATS filters and landing interviews. Ready to create an optimized resume? <a href="/builder">Start building with ResumeAI Pro today</a>.</p>
    `,
    category: 'resume-tips',
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      role: 'Career Coach',
      bio: 'Sarah is a certified career coach with over 10 years of experience helping professionals land their dream jobs at Fortune 500 companies.'
    },
    coverImage: '📄',
    readTime: '6 min read',
    publishedAt: '2024-01-15',
    tags: ['Resume', 'Job Search', 'Career', 'ATS'],
    featured: true,
    views: 12453,
    likes: 342
  },
  {
    id: 2,
    slug: 'optimize-resume-for-ats-systems-2025',
    title: 'How to Optimize Your Resume for ATS Systems in 2025',
    excerpt: 'Learn the latest strategies to ensure your resume passes through Applicant Tracking Systems and reaches human recruiters.',
    content: `
      <p class="lead">With over 75% of resumes never reaching human eyes, understanding how to optimize for Applicant Tracking Systems (ATS) is crucial for job search success in 2025.</p>
      
      <h2>What is an ATS?</h2>
      <p>An Applicant Tracking System is software used by employers to collect, sort, and filter job applications. It scans resumes for relevant keywords, skills, and qualifications before a recruiter ever sees them.</p>
      
      <h2>Key ATS Optimization Strategies for 2025</h2>
      
      <h3>1. Use Standard Section Headings</h3>
      <p>Stick to conventional headings like "Work Experience," "Education," and "Skills." Avoid creative alternatives like "Where I've Been" or "What I Know."</p>
      
      <h3>2. Incorporate Keywords Naturally</h3>
      <p>Analyze the job description and incorporate relevant keywords throughout your resume. Use ResumeAI Pro's AI-powered keyword suggestions to identify the most important terms.</p>
      
      <h3>3. Avoid Complex Formatting</h3>
      <p>Tables, columns, graphics, and unusual fonts can confuse ATS software. Stick to a clean, single-column layout with standard fonts like Arial, Calibri, or Times New Roman.</p>
      
      <h3>4. Use Both Acronyms and Full Terms</h3>
      <p>Include both the acronym and full term (e.g., "Search Engine Optimization (SEO)") to ensure the ATS catches the keyword regardless of format.</p>
      
      <h3>5. Quantify Your Achievements</h3>
      <p>Use numbers, percentages, and dollar amounts to demonstrate impact. Example: "Increased sales by 35% within 6 months."</p>
      
      <h3>6. Save in the Right Format</h3>
      <p>While most modern ATS can read PDFs, some older systems prefer .docx files. Check the job posting for specific instructions.</p>
      
      <h3>7. Avoid Headers and Footers</h3>
      <p>Information in headers and footers may be skipped by ATS software. Keep all important content in the main body.</p>
      
      <h2>Common ATS Myths Debunked</h2>
      <ul>
        <li><strong>Myth:</strong> You need to "stuff" keywords everywhere.</li>
        <li><strong>Truth:</strong> Use keywords naturally in context. Keyword stuffing can flag your resume as spam.</li>
        <li><strong>Myth:</strong> ATS automatically rejects most applications.</li>
        <li><strong>Truth:</strong> ATS ranks and filters, but human recruiters review qualified applications.</li>
      </ul>
      
      <h2>Test Your Resume's ATS Compatibility</h2>
      <p>Use ResumeAI Pro's free ATS Scanner to analyze your resume and get a detailed compatibility score with actionable improvement suggestions.</p>
    `,
    category: 'ats-guide',
    author: {
      name: 'Usman Murtaza',
      avatar: 'UM',
      role: 'Founder & CEO',
      bio: 'Usman is the founder of ResumeAI Pro and a full-stack developer passionate about helping job seekers leverage technology to advance their careers.'
    },
    coverImage: '🤖',
    readTime: '8 min read',
    publishedAt: '2024-01-10',
    tags: ['ATS', 'Resume Optimization', 'Job Search', 'Technology'],
    featured: true,
    views: 18934,
    likes: 567
  },
  {
    id: 3,
    slug: 'achievement-based-resume-bullets-guide',
    title: 'The Ultimate Guide to Writing Achievement-Based Resume Bullets',
    excerpt: 'Transform your resume from a list of duties to a compelling story of achievements with these proven techniques.',
    content: `
      <p class="lead">Recruiters spend an average of 6-7 seconds scanning a resume. Achievement-based bullet points grab attention and demonstrate your value proposition immediately.</p>
      
      <h2>Why Achievement-Based Bullets Matter</h2>
      <p>Job duties tell employers what you were supposed to do. Achievements show what you actually accomplished. The difference can mean landing an interview or getting passed over.</p>
      
      <h2>The STAR Method for Resume Bullets</h2>
      <p>Use the STAR framework to structure your achievements:</p>
      <ul>
        <li><strong>Situation:</strong> What was the context or challenge?</li>
        <li><strong>Task:</strong> What was your responsibility?</li>
        <li><strong>Action:</strong> What specific actions did you take?</li>
        <li><strong>Result:</strong> What was the quantifiable outcome?</li>
      </ul>
      
      <h2>Powerful Action Verbs by Category</h2>
      <h3>Leadership</h3>
      <p>Led, Managed, Directed, Supervised, Spearheaded, Orchestrated, Guided, Mentored</p>
      
      <h3>Achievement</h3>
      <p>Achieved, Increased, Decreased, Improved, Reduced, Generated, Delivered, Exceeded</p>
      
      <h3>Development</h3>
      <p>Developed, Created, Designed, Built, Implemented, Launched, Established, Founded</p>
      
      <h3>Analysis</h3>
      <p>Analyzed, Evaluated, Assessed, Researched, Investigated, Identified, Reviewed, Audited</p>
      
      <h2>Before and After Examples</h2>
      
      <div class="example">
        <h4>Before (Duty-Based):</h4>
        <p class="bad">Responsible for managing social media accounts.</p>
        
        <h4>After (Achievement-Based):</h4>
        <p class="good">Grew Instagram following from 500 to 15,000 in 6 months, increasing engagement by 200% and driving $50K in attributable revenue.</p>
      </div>
      
      <div class="example">
        <h4>Before (Duty-Based):</h4>
        <p class="bad">Handled customer service inquiries.</p>
        
        <h4>After (Achievement-Based):</h4>
        <p class="good">Resolved 95% of customer inquiries on first contact, achieving 4.8/5 satisfaction rating and reducing escalation rate by 40%.</p>
      </div>
      
      <h2>Quantifying Achievements When You Don't Have Numbers</h2>
      <p>Not every role has clear metrics. Use these alternatives:</p>
      <ul>
        <li>Scale: "Managed social media presence across 5 platforms"</li>
        <li>Frequency: "Processed 50+ customer orders daily"</li>
        <li>Scope: "Supported sales team of 15 representatives"</li>
        <li>Comparison: "Recognized as top performer among 30+ team members"</li>
      </ul>
    `,
    category: 'resume-tips',
    author: {
      name: 'Michael Rodriguez',
      avatar: 'MR',
      role: 'Senior Recruiter',
      bio: 'Michael has reviewed over 50,000 resumes during his 12-year career in talent acquisition at Fortune 500 companies.'
    },
    coverImage: '🎯',
    readTime: '7 min read',
    publishedAt: '2024-01-05',
    tags: ['Resume Writing', 'Achievements', 'Career', 'STAR Method'],
    featured: false,
    views: 8765,
    likes: 234
  },
  {
    id: 4,
    slug: 'top-20-action-verbs-resume',
    title: 'Top 20 Action Verbs That Will Make Your Resume Stand Out',
    excerpt: 'Powerful action verbs that grab attention and showcase your accomplishments effectively.',
    content: `
      <p class="lead">The words you choose on your resume matter. Strong action verbs convey confidence, competence, and impact. Here are the top 20 action verbs organized by skill category.</p>
      
      <h2>Leadership Verbs</h2>
      <ol>
        <li><strong>Spearheaded</strong> - Conveys initiative and leadership in launching new projects</li>
        <li><strong>Orchestrated</strong> - Shows complex coordination and management skills</li>
        <li><strong>Mentored</strong> - Demonstrates ability to develop and guide others</li>
        <li><strong>Championed</strong> - Indicates advocacy and driving change</li>
      </ol>
      
      <h2>Achievement Verbs</h2>
      <ol start="5">
        <li><strong>Achieved</strong> - Clear indicator of success and goal attainment</li>
        <li><strong>Exceeded</strong> - Shows you went above and beyond expectations</li>
        <li><strong>Generated</strong> - Perfect for revenue and business development roles</li>
        <li><strong>Delivered</strong> - Demonstrates reliability and follow-through</li>
      </ol>
      
      <h2>Innovation Verbs</h2>
      <ol start="9">
        <li><strong>Pioneered</strong> - Indicates you were first to implement something</li>
        <li><strong>Revolutionized</strong> - Shows transformative impact</li>
        <li><strong>Conceptualized</strong> - Demonstrates creative thinking and ideation</li>
        <li><strong>Engineered</strong> - Technical precision and problem-solving</li>
      </ol>
      
      <h2>Efficiency Verbs</h2>
      <ol start="13">
        <li><strong>Streamlined</strong> - Shows process improvement</li>
        <li><strong>Optimized</strong> - Indicates performance enhancement</li>
        <li><strong>Automated</strong> - Demonstrates technical efficiency</li>
        <li><strong>Consolidated</strong> - Shows ability to simplify and integrate</li>
      </ol>
      
      <h2>Collaboration Verbs</h2>
      <ol start="17">
        <li><strong>Facilitated</strong> - Shows ability to enable group success</li>
        <li><strong>Partnered</strong> - Demonstrates cross-functional collaboration</li>
        <li><strong>Negotiated</strong> - Indicates persuasion and deal-making skills</li>
        <li><strong>Unified</strong> - Shows ability to bring teams together</li>
      </ol>
      
      <h2>How to Use Action Verbs Effectively</h2>
      <ul>
        <li>Start each bullet point with a strong action verb</li>
        <li>Vary your verbs to avoid repetition</li>
        <li>Choose verbs that accurately reflect your contribution level</li>
        <li>Pair verbs with quantifiable results for maximum impact</li>
      </ul>
    `,
    category: 'resume-tips',
    author: {
      name: 'Emily Watson',
      avatar: 'EW',
      role: 'Content Strategist',
      bio: 'Emily specializes in creating compelling career content that helps professionals tell their unique stories effectively.'
    },
    coverImage: '⚡',
    readTime: '5 min read',
    publishedAt: '2024-01-01',
    tags: ['Resume Tips', 'Writing', 'Keywords', 'Action Verbs'],
    featured: false,
    views: 6543,
    likes: 189
  },
  {
    id: 5,
    slug: 'write-cover-letter-complements-resume',
    title: 'How to Write a Cover Letter That Complements Your Resume',
    excerpt: 'Learn how to craft a compelling cover letter that works in harmony with your resume to land more interviews.',
    content: `
      <p class="lead">A great cover letter doesn't just repeat your resume—it tells the story behind your achievements and demonstrates why you're the perfect fit for this specific role.</p>
      
      <h2>The Purpose of a Cover Letter</h2>
      <p>Your resume shows what you've done. Your cover letter explains why it matters and how it connects to the job you're applying for.</p>
      
      <h2>Cover Letter Structure</h2>
      
      <h3>1. Opening Paragraph</h3>
      <p>State the position you're applying for and include a hook that grabs attention. Mention a mutual connection or a specific reason you're excited about the company.</p>
      
      <h3>2. Body Paragraphs (2-3)</h3>
      <p>Highlight 2-3 key achievements from your resume and explain how they've prepared you for this role. Use the job description to identify which experiences to emphasize.</p>
      
      <h3>3. Closing Paragraph</h3>
      <p>Reiterate your interest, include a call to action, and thank the reader for their consideration.</p>
      
      <h2>What NOT to Include</h2>
      <ul>
        <li>Don't repeat your resume verbatim</li>
        <li>Don't use generic phrases like "I'm writing to apply for..."</li>
        <li>Don't focus on what the job can do for you</li>
        <li>Don't exceed one page</li>
      </ul>
      
      <h2>Cover Letter Template</h2>
      <div class="template">
        <p>Dear [Hiring Manager Name],</p>
        <p>I was excited to see the [Position] opening at [Company] because [specific reason related to company mission/product]. With [X] years of experience in [field], I've developed a strong foundation in [key skill 1] and [key skill 2] that I believe would make me a valuable addition to your team.</p>
        <p>In my current role at [Current Company], I [achievement with metrics]. This experience has prepared me to [how it relates to new role].</p>
        <p>I would welcome the opportunity to discuss how my background in [field] can contribute to [Company]'s continued success. Thank you for your consideration.</p>
        <p>Best regards,<br>[Your Name]</p>
      </div>
    `,
    category: 'career-advice',
    author: {
      name: 'David Kim',
      avatar: 'DK',
      role: 'HR Director',
      bio: 'David has 15+ years of HR leadership experience and has hired hundreds of professionals across various industries.'
    },
    coverImage: '📝',
    readTime: '6 min read',
    publishedAt: '2023-12-28',
    tags: ['Cover Letter', 'Job Application', 'Career', 'Writing'],
    featured: false,
    views: 5432,
    likes: 156
  },
  {
    id: 6,
    slug: 'networking-strategies-2025',
    title: 'Networking Strategies That Actually Work in 2025',
    excerpt: 'Modern networking techniques to build meaningful professional relationships and uncover hidden job opportunities.',
    content: `
      <p class="lead">Networking isn't about collecting business cards or LinkedIn connections—it's about building genuine relationships that create mutual value. Here's how to network effectively in 2025.</p>
      
      <h2>The 80/20 Rule of Networking</h2>
      <p>Spend 80% of your networking time giving value (sharing insights, making introductions, offering help) and only 20% asking for anything in return.</p>
      
      <h2>Digital Networking Strategies</h2>
      
      <h3>1. LinkedIn Optimization</h3>
      <p>Your LinkedIn profile is your digital business card. Ensure it's complete with a professional photo, compelling headline, and detailed experience section.</p>
      
      <h3>2. Engaging Content Creation</h3>
      <p>Share insights, comment thoughtfully on others' posts, and publish articles to establish your expertise and attract opportunities.</p>
      
      <h3>3. Virtual Coffee Chats</h3>
      <p>Request 15-20 minute informational interviews with professionals in your target industry. Come prepared with thoughtful questions.</p>
      
      <h2>In-Person Networking</h2>
      <ul>
        <li>Attend industry conferences and local meetups</li>
        <li>Volunteer for professional organizations</li>
        <li>Join alumni groups and events</li>
        <li>Participate in hackathons or industry competitions</li>
      </ul>
      
      <h2>Follow-Up Formula</h2>
      <p>Within 24 hours of meeting someone, send a personalized follow-up referencing something specific from your conversation. Suggest a concrete next step when appropriate.</p>
      
      <h2>Networking Email Template</h2>
      <div class="template">
        <p>Subject: Great connecting at [Event]</p>
        <p>Hi [Name],</p>
        <p>It was great meeting you at [event] and learning about your work in [specific topic]. I was particularly interested in [specific detail from conversation].</p>
        <p>[Optional: Offer value - share an article, make an introduction, etc.]</p>
        <p>I'd love to stay in touch and follow your work. If you're open to it, I'd enjoy continuing our conversation over a virtual coffee sometime in the next few weeks.</p>
        <p>Best,<br>[Your Name]</p>
      </div>
    `,
    category: 'job-search',
    author: {
      name: 'Jessica Lee',
      avatar: 'JL',
      role: 'Career Strategist',
      bio: 'Jessica helps professionals navigate career transitions and has been featured in Forbes, Business Insider, and The Muse.'
    },
    coverImage: '🤝',
    readTime: '7 min read',
    publishedAt: '2023-12-20',
    tags: ['Networking', 'Job Search', 'Career Growth', 'LinkedIn'],
    featured: false,
    views: 4321,
    likes: 123
  }
];

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
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'John Smith',
      avatar: 'JS',
      content: 'This is incredibly helpful! I just updated my resume using these tips.',
      date: '2 days ago',
      likes: 12
    },
    {
      id: 2,
      author: 'Maria Garcia',
      avatar: 'MG',
      content: 'The STAR method section was exactly what I needed. Thank you for this detailed guide!',
      date: '1 day ago',
      likes: 8
    }
  ]);

  useDocumentTitle(post ? `${post.title} | ResumeAI Pro Blog` : 'Blog Post | ResumeAI Pro');

  useEffect(() => {
    setLoading(true);
    const foundPost = blogPosts.find(p => p.slug === slug);
    
    if (foundPost) {
      setPost(foundPost);
      const related = blogPosts
        .filter(p => p.category === foundPost.category && p.id !== foundPost.id)
        .slice(0, 3);
      setRelatedPosts(related);
    }
    
    setLoading(false);
  }, [slug]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLike = () => {
    setLiked(!liked);
    toast.success(liked ? 'Removed like' : 'Post liked!');
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? 'Removed from bookmarks' : 'Post bookmarked!');
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this article: ${post?.title}`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    } else {
      navigator.clipboard?.writeText(url);
      toast.success('Link copied to clipboard!');
    }
    
    setShowShareMenu(false);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([
        {
          id: comments.length + 1,
          author: 'You',
          avatar: 'YO',
          content: comment,
          date: 'Just now',
          likes: 0
        },
        ...comments
      ]);
      setComment('');
      toast.success('Comment posted!');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
          <Loader size="lg" message="Loading article..." />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <FiBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
            <p className="text-gray-500 mb-6">The article you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/blog')}>
              Back to Blog
            </Button>
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
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 text-gray-500 hover:text-primary-500 mb-6 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Blog
            </motion.button>

            {/* Article Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Badge variant="primary" className="mb-4">
                {post.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Badge>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {post.title}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                {post.excerpt}
              </p>

              {/* Author and Meta */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <Avatar name={post.author.avatar} size="lg" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {post.author.name}
                    </p>
                    <p className="text-sm text-gray-500">{post.author.role}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-4 h-4" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {post.readTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiEye className="w-4 h-4" />
                    {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}k views` : `${post.views} views`}
                  </span>
                </div>
              </div>
            </motion.header>

            {/* Article Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="prose prose-lg dark:prose-invert max-w-none mb-8"
            >
              <style jsx>{`
                .prose h2 {
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                }
                .prose h3 {
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .prose .lead {
                  font-size: 1.25rem;
                  line-height: 1.6;
                  color: #4b5563;
                }
                .prose .example {
                  background: #f9fafb;
                  padding: 1.5rem;
                  border-radius: 0.75rem;
                  margin: 1.5rem 0;
                }
                .dark .prose .example {
                  background: #1f2937;
                }
                .prose .bad {
                  color: #dc2626;
                  text-decoration: line-through;
                }
                .prose .good {
                  color: #16a34a;
                }
                .prose .template {
                  background: #f3f4f6;
                  padding: 1.5rem;
                  border-radius: 0.75rem;
                  font-family: monospace;
                  margin: 1.5rem 0;
                }
                .dark .prose .template {
                  background: #374151;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </motion.div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    liked 
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <FiHeart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  <span>{liked ? post.likes + 1 : post.likes}</span>
                </button>
                
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    bookmarked 
                      ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }`}
                >
                  <FiBookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                  <span>{bookmarked ? 'Saved' : 'Save'}</span>
                </button>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <FiShare2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
                
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-2">
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiTwitter className="w-4 h-4 text-blue-400" />
                          Twitter
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiLinkedin className="w-4 h-4 text-blue-600" />
                          LinkedIn
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiFacebook className="w-4 h-4 text-blue-500" />
                          Facebook
                        </button>
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <FiLink className="w-4 h-4" />
                          Copy Link
                        </button>
                      </div>
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
                  <p className="text-gray-600 dark:text-gray-400">{post.author.bio}</p>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                Comments ({comments.length})
              </h2>
              
              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex gap-3">
                  <Avatar name="YO" size="md" />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button type="submit" disabled={!comment.trim()}>
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
              
              {/* Comments List */}
              <div className="space-y-4">
                {comments.map(comment => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Avatar name={comment.avatar} size="md" />
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-xs text-gray-500">{comment.date}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                      </div>
                      <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-500 mt-1 ml-1">
                        <FiThumbsUp className="w-3 h-3" />
                        {comment.likes} {comment.likes === 1 ? 'Like' : 'Likes'}
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
                  {relatedPosts.map(related => (
                    <Link to={`/blog/${related.slug}`} key={related.id}>
                      <Card className="h-full hover:shadow-xl transition-all group">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 h-40 flex items-center justify-center">
                          <span className="text-5xl group-hover:scale-110 transition-transform">
                            {related.coverImage}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">
                            {related.title}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {related.readTime}
                          </p>
                        </div>
                      </Card>
                    </Link>
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