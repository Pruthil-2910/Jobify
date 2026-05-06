// Mock data — used until backend has real records.

export const MOCK_JOBS = [
  { id: 1, title: 'Senior Frontend Engineer', company: 'Lumen Labs', location: 'Remote · US', salary: '$140k–$180k', match: 94, tags: ['React', 'TypeScript', 'Design Systems'], time: '2d ago', logo: 'LL' },
  { id: 2, title: 'Product Designer, AI Tools', company: 'Pulsar', location: 'San Francisco', salary: '$130k–$170k', match: 88, tags: ['Figma', 'Prototyping', 'AI/UX'], time: '4h ago', logo: 'PL' },
  { id: 3, title: 'Staff ML Engineer', company: 'Nebulae', location: 'Remote · Global', salary: '$200k–$260k', match: 76, tags: ['PyTorch', 'LLMs', 'RAG'], time: '1d ago', logo: 'NB' },
  { id: 4, title: 'Full-stack Developer', company: 'Cosmos.io', location: 'Berlin · Hybrid', salary: '€80k–€110k', match: 82, tags: ['Node', 'PostgreSQL', 'Next.js'], time: '6h ago', logo: 'CO' },
  { id: 5, title: 'UX Researcher', company: 'Apogee', location: 'New York', salary: '$110k–$150k', match: 64, tags: ['Mixed methods', 'Surveys', 'Synthesis'], time: '3d ago', logo: 'AP' },
  { id: 6, title: 'Engineering Manager', company: 'Helio', location: 'Remote · EU', salary: '€130k–€170k', match: 71, tags: ['Leadership', 'Frontend', 'Hiring'], time: '5d ago', logo: 'HE' },
];

export const DEFAULT_RESUME = {
  name: 'Riya Patel',
  title: 'Senior Frontend Engineer',
  email: 'riya@orbit.com',
  phone: '+1 (415) 555-0142',
  location: 'San Francisco, CA',
  website: 'riya.studio',
  summary: 'Frontend engineer with 7+ years building design-systems and accessible product UI. I care about taste, performance, and the people who use the things I build.',
  experience: [
    { id: 1, role: 'Senior Frontend Engineer', company: 'Stellar Co.', period: '2023 — Now', bullets: ['Led the rewrite of the design system, cutting build time 60%.', 'Mentored 4 engineers; ran weekly craft reviews.', 'Shipped the new editor used by 80k weekly users.'] },
    { id: 2, role: 'Frontend Engineer', company: 'Apogee', period: '2020 — 2023', bullets: ['Owned the marketing site rebuild — Core Web Vitals all green.', 'Built component library used across 6 product surfaces.'] },
  ],
  skills: ['React', 'TypeScript', 'Design Systems', 'Next.js', 'Accessibility', 'Figma', 'Node.js', 'GraphQL'],
  education: [
    { id: 1, school: 'UC Berkeley', degree: 'B.S. Computer Science', period: '2014 — 2018' },
  ],
};

export function timeAgo(ts) {
  if (!ts) return 'recently';
  const diff = Date.now() - new Date(ts).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
