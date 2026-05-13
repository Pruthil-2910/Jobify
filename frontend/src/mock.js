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
  name: 'Your Name',
  title: 'Target Role Title',
  email: 'your.email@example.com',
  phone: '+1 555-0100',
  location: 'City, Country',
  website: 'portfolio.com',
  summary: 'A brief, impactful summary of your career highlights and the value you bring to a team. Focus on outcomes and key competencies.',
  experience: [
    { id: 1, role: 'Current Role', company: 'Current Company', period: '2022 — Present', bullets: ['Key achievement starting with an action verb.', 'Quantifiable impact (e.g. reduced latency by 40%).', 'Team leadership or cross-functional collaboration highlight.'] },
    { id: 2, role: 'Previous Role', company: 'Previous Company', period: '2019 — 2022', bullets: ['Built a core product feature from 0 to 1.', 'Optimized internal workflows saving 10 hours/week.'] },
  ],
  skills: ['Core Skill 1', 'Skill 2', 'Skill 3', 'Framework A', 'Library B', 'Tool C'],
  education: [
    { id: 1, school: 'University Name', degree: 'Degree Name', period: '2015 — 2019' },
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
