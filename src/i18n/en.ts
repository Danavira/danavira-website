export const en = {
  skipToContent: 'Skip to content',
  nav: {
    label: 'Main',
    home: 'Home',
    projects: 'Projects',
    homelab: 'Homelab',
    writing: 'Blog',
    cv: 'Resume',
    certifications: 'Certifications',
    contact: 'Contact',
    journal: 'Journal',
  },
  langSwitch: { label: '日本語', hreflang: 'ja' },
  home: {
    credentials: 'Certifications',
    featured: 'Featured case study',
    projects: 'Projects',
    allProjects: 'All projects',
    writing: 'Latest posts',
    allWriting: 'All posts',
    contact: 'Links',
    allCertifications: 'All certifications',
    about: 'About',
    facts: {
      now: 'Now',
      based: 'Based in',
      studied: 'Studied',
      languages: 'Languages',
    },
    fullResume: 'Full resume',
  },
  links: { cv: 'Resume', github: 'GitHub', linkedin: 'LinkedIn', email: 'Email' },
  project: {
    readCaseStudy: 'Read the case study',
    stack: 'Stack',
    // Every case study must contain these h2 headings, in any order. The build
    // fails if one is missing so the template cannot drift.
    requiredSections: [
      'Context',
      'Architecture',
      'Decisions and tradeoffs',
      'What broke and how I fixed it',
      'Results',
    ],
  },
  projectsIndex: {
    title: 'Projects',
    description: 'Case studies of infrastructure and data platforms I have built and run.',
  },
  journal: {
    title: 'Journal',
    description: 'Life in Tokyo, work and what I have been up to lately, with photos.',
    lately: 'Lately',
    all: 'All updates',
    back: 'Journal',
  },
  writingIndex: {
    title: 'Blog',
    description: 'Writing on tech, work and life in Japan.',
    tags: 'Tags',
    allPosts: 'All posts',
    taggedTitle: (tag: string) => `Posts tagged “${tag}”`,
    taggedDescription: (tag: string) => `Every post on this site tagged ${tag}.`,
  },
  post: { published: 'Published', updated: 'Updated', draft: 'Draft', tags: 'Tags' },
  cv: {
    download: 'Download as PDF',
    experience: 'Experience',
    projects: 'Selected projects',
    certifications: 'Certifications',
    skills: 'Skills',
    education: 'Education',
    present: 'Present',
    graduated: 'Graduated',
  },
  certifications: {
    title: 'Certifications',
    description:
      'Kubernetes, AWS and language certifications, each with its credential ID and a way to verify it.',
    categories: {
      kubernetes: 'Kubernetes and cloud native',
      cloud: 'Cloud',
      language: 'Languages',
      skills: 'Skills',
    },
    earned: 'Earned',
    expires: 'Valid until',
    credentialId: 'Credential ID',
    verify: 'Verify',
    credly: 'Credly badge',
    pdf: 'Certificate (PDF)',
    verifyHint:
      'Linux Foundation and AWS credentials are verified on the issuer’s site with the credential ID and the surname Danavira.',
  },
  contact: {
    title: 'Contact',
    description:
      'How to reach Yasa Danavira about data and platform engineering roles or projects.',
    lead: 'Email is the best way to reach me. I usually reply within a couple of days.',
    elsewhere: 'Elsewhere',
  },
  notFound: {
    title: 'Page not found',
    description: 'This page does not exist.',
    back: 'Go to the home page',
  },
  footer: { source: 'Source' },
};

export type Dictionary = typeof en;
