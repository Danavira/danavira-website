// Facts used across the site: header, footer, JSON-LD and OG images.
// Certifications, roles, skills and education live in src/data/ instead, where
// the CMS at /admin/ can edit them.
export const site = {
  name: 'Yasa Danavira',
  url: 'https://danavira.com',
  jobTitle: 'Data & Platform Engineer',
  location: 'Tokyo',
  email: 'yasa@danavira.com',
  github: 'https://github.com/Danavira',
  linkedin: 'https://www.linkedin.com/in/yasa-danavira',
  // Work authorization line shown on /cv/ and /contact/.
  availability: 'Based in Tokyo on a J-Find visa, authorized to work immediately.',
  education: { degree: 'B.Sc. Data Science', school: 'University of Melbourne' },
} as const;
