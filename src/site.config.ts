// Facts used across the site: header, footer, JSON-LD and OG images.
export const site = {
  name: 'Yasa',
  url: 'https://danavira.com',
  jobTitle: 'Data & Platform Engineer',
  location: 'Tokyo',
  // TODO(yasa): public contact address. Shown as a plain mailto link.
  email: 'TODO-yasa@example.com',
  // TODO(yasa): confirm this is the profile you want linked.
  github: 'https://github.com/Danavira',
  // TODO(yasa): LinkedIn profile URL.
  linkedin: 'https://www.linkedin.com/in/TODO-yasa/',
  credentials: [
    'CNCF Kubestronaut',
    'AWS Certified Data Engineer Associate',
    'AWS Certified Solutions Architect Associate',
  ],
  education: { degree: 'B.Sc. Data Science', school: 'University of Melbourne' },
} as const;
