export const en = {
  skipToContent: 'Skip to content',
  nav: {
    label: 'Main',
    home: 'Home',
    projects: 'Projects',
    homelab: 'Homelab',
    writing: 'Writing',
    cv: 'CV',
  },
  langSwitch: { label: '日本語', hreflang: 'ja' },
  home: {
    credentials: 'Certifications',
    featured: 'Featured case study',
    projects: 'Projects',
    allProjects: 'All projects',
    writing: 'Latest writing',
    allWriting: 'All writing',
    contact: 'Links',
  },
  links: { cv: 'CV (PDF)', github: 'GitHub', linkedin: 'LinkedIn', email: 'Email' },
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
  writingIndex: {
    title: 'Writing',
    description: 'Notes on platform engineering, Kubernetes and data infrastructure.',
  },
  post: { published: 'Published', updated: 'Updated', draft: 'Draft' },
  cv: { download: 'Download the CV (PDF)', embedTitle: 'CV' },
  notFound: {
    title: 'Page not found',
    description: 'This page does not exist.',
    back: 'Go to the home page',
  },
  footer: { source: 'Source' },
};

export type Dictionary = typeof en;
