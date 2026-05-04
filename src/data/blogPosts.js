// src/data/blogPosts.js
// Shared blog post data used by both Blog.jsx and BlogPost.jsx

export const BLOG_POSTS = [
  {
    id: 1,
    slug: 'resume-mistakes-costing-interviews',
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
      
      <h2>5. Poor Formatting and Inconsistent Styling</h2>
      <p>Inconsistent fonts, spacing, and formatting make your resume look unprofessional. <strong>Solution:</strong> Use a clean, ATS-friendly template with consistent formatting throughout.</p>
      
      <h2>6. Spelling and Grammar Errors</h2>
      <p>Typos suggest a lack of attention to detail. <strong>Solution:</strong> Use spell-check tools, read your resume aloud, and have someone else review it.</p>
      
      <h2>7. Missing Keywords for ATS</h2>
      <p>Applicant Tracking Systems scan for specific keywords. <strong>Solution:</strong> Use ResumeAI Pro's ATS Scanner to identify missing keywords from your target job description.</p>
      
      <h2>8. Including Personal Information</h2>
      <p>Never include your photo, age, marital status, religion, or social security number. <strong>Solution:</strong> Stick to professional contact information only.</p>
      
      <h2>9. Submitting as a Word Document</h2>
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
      <p>Use the STAR framework to structure your achievements: <strong>Situation</strong> (context), <strong>Task</strong> (responsibility), <strong>Action</strong> (what you did), <strong>Result</strong> (quantifiable outcome).</p>
      
      <h2>Before and After Examples</h2>
      
      <h4>Before (Duty-Based):</h4>
      <p style="color: #dc2626; text-decoration: line-through;">Responsible for managing social media accounts.</p>
      
      <h4>After (Achievement-Based):</h4>
      <p style="color: #16a34a;">Grew Instagram following from 500 to 15,000 in 6 months, increasing engagement by 200% and driving $50K in attributable revenue.</p>
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
      <p class="lead">The words you choose on your resume matter. Strong action verbs convey confidence, competence, and impact.</p>
      
      <h2>Leadership Verbs</h2>
      <ol><li><strong>Spearheaded</strong> - Conveys initiative in launching new projects</li><li><strong>Orchestrated</strong> - Shows complex coordination skills</li><li><strong>Mentored</strong> - Demonstrates ability to develop others</li><li><strong>Championed</strong> - Indicates advocacy and driving change</li></ol>
      
      <h2>Achievement Verbs</h2>
      <ol start="5"><li><strong>Achieved</strong> - Clear indicator of success</li><li><strong>Exceeded</strong> - Shows going above expectations</li><li><strong>Generated</strong> - Perfect for revenue roles</li><li><strong>Delivered</strong> - Demonstrates reliability</li></ol>
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
      <p class="lead">A great cover letter doesn't just repeat your resume—it tells the story behind your achievements.</p>
      
      <h2>Cover Letter Structure</h2>
      <h3>1. Opening Paragraph</h3><p>State the position and include a hook that grabs attention.</p>
      <h3>2. Body Paragraphs (2-3)</h3><p>Highlight 2-3 key achievements from your resume and explain how they've prepared you for this role.</p>
      <h3>3. Closing Paragraph</h3><p>Reiterate your interest and include a call to action.</p>
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
      <p class="lead">Networking isn't about collecting business cards or LinkedIn connections—it's about building genuine relationships.</p>
      
      <h2>Digital Networking Strategies</h2>
      <h3>1. LinkedIn Optimization</h3><p>Your LinkedIn profile is your digital business card.</p>
      <h3>2. Engaging Content Creation</h3><p>Share insights and comment thoughtfully on others' posts.</p>
      <h3>3. Virtual Coffee Chats</h3><p>Request 15-20 minute informational interviews with professionals in your target industry.</p>
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