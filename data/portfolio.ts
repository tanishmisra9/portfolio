import type { PortfolioContent } from '@/types/content';

export const portfolio: PortfolioContent = {
  name: 'TANISH MISRA',
  heroSubtitle:
    'Building practical AI for complex, real-world constraints.\nCS @ Purdue | Incoming @ Toyota Connected Technologies',
  experience: [
    {
      id: 'exp-01',
      date: 'Incoming, Summer 2026',
      org: 'Toyota Connected Technologies',
      role: 'Incoming STEM Co-op Intern',
      tags: ['AI/ML', 'Software Engineering'],
    },
    {
      id: 'exp-02',
      date: 'Jan 2026 - Present',
      org: 'Purdue Electric Racing',
      role: 'Software Team Developer',
      tags: ['C', 'STM32', 'Embedded Firmware'],
    },
    {
      id: 'exp-03',
      date: 'Jan 2026 - Present',
      org: 'The Data Mine',
      role: 'Undergraduate Data Science Researcher',
      tags: ['Python', 'SQL', 'Pandas', 'NumPy', 'Matplotlib'],
    },
    {
      id: 'exp-04',
      date: 'Aug 2025 - Present',
      org: 'Purdue Electric Vehicle Club',
      role: 'OpenCV Developer',
      tags: ['Python', 'OpenCV', 'Docker'],
    },
    {
      id: 'exp-05',
      date: 'June 2023 - August 2025',
      org: "Karen Dillard's College Prep",
      role: 'Student Worker',
      tags: ['CRM', 'Operations', 'Customer Service', 'Office Administration'],
    },
    {
      id: 'exp-06',
      date: 'Mar 2024 - Jul 2025',
      org: 'Q Spark Group',
      role: 'Data, Analytics, and AI Intern',
      tags: ['NER Models', 'Python', 'SQL', 'Pandas'],
    },
  ],
  education: [
    {
      id: 'edu-01',
      date: 'Aug 2025 - May 2028',
      institution: 'Purdue University',
      credential: 'B.S. Computer Science (Machine Intelligence & Security)',
      pillRows: [
        [
          'PER',
          'EVC',
          'Google Developer Group',
          'Claude Builder Club',
          'F1@P',
        ],
        [
          'Problem Solving & OOP',
          'Programming in C',
          'TDM',
          'Linear Algebra',
          'Discrete Math',
          'Multivariate Calculus',
        ],
      ],
    },
    {
      id: 'edu-02',
      date: 'May 2025',
      institution: 'Plano West Senior High School',
      credential:
        'Distinguished Level of Achievement, High School Diploma (Summa Cum Laude)',
      pillRows: [
        [
          'Clarinet player',
          'Logistics Captain',
          'AI Club Officer',
          'NHS',
        ],
      ],
    },
  ],
  skills: [
    {
      id: 'skills-programming',
      category: 'Programming Languages',
      items: ['Python', 'TypeScript', 'JavaScript', 'C', 'Java', 'SQL'],
    },
    {
      id: 'skills-ml',
      category: 'AI & Machine Learning',
      items: [
        'PyTorch',
        'scikit-learn',
        'spaCy',
        'Hugging Face Transformers',
        'sentence-transformers',
        'LangChain',
        'LangGraph',
        'OpenAI API',
        'pgvector',
        'OpenCV',
      ],
    },
    {
      id: 'skills-backend-data',
      category: 'Backend & Data',
      items: [
        'FastAPI',
        'SQLAlchemy',
        'Pydantic',
        'PostgreSQL',
        'MySQL',
        'SQLite',
        'Polars',
        'Pandas',
        'NumPy',
        'Matplotlib',
      ],
    },
    {
      id: 'skills-frontend',
      category: 'Frontend',
      items: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion', 'Vite'],
    },
    {
      id: 'skills-devtools',
      category: 'Developer Tools',
      items: [
        'Git/GitHub',
        'Docker',
        'docker-compose',
        'REST APIs',
        'pytest',
        'ruff',
        'uv',
        'Streamlit',
        'Vercel',
        'Railway',
        'STM32',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-umich-c',
      issuer: 'University of Michigan',
      title: 'Programming in C',
      credentialUrl:
        'https://www.coursera.org/account/accomplishments/verify/8O423G7AHCWV',
      pills: ['university of michigan'],
      skills: ['C'],
    },
    {
      id: 'cert-aws-dlai',
      issuer: 'AWS & DeepLearning.AI',
      title: 'Generative AI & Large Language Models',
      credentialUrl:
        'https://www.coursera.org/account/accomplishments/verify/1R7ECY5UIWVV',
      pills: ['aws', 'deeplearning.ai'],
      skills: ['Prompt Engineering', 'NLP', 'RLHF', 'Generative AI', 'LLM'],
    },
    {
      id: 'cert-google-cyber-risks',
      issuer: 'Google Cybersecurity Certificate',
      title: 'Manage Security Risks',
      credentialUrl:
        'https://www.coursera.org/account/accomplishments/verify/SR4FKRAQKNEQ',
      pills: ['google'],
      skills: ['OWASP', 'SIEM', 'Vulnerability Management'],
    },
    {
      id: 'cert-google-cyber-networks',
      issuer: 'Google Cybersecurity Certificate',
      title: 'Networks and Network Security',
      credentialUrl:
        'https://www.coursera.org/account/accomplishments/verify/WVO8VIFCW4UH',
      pills: ['google'],
      skills: ['Network Security', 'Protocols', 'TCP/IP', 'Hardening', 'Network Architecture'],
    },
    {
      id: 'cert-google-cyber-foundations',
      issuer: 'Google Cybersecurity Certificate',
      title: 'Foundations of Cybersecurity',
      credentialUrl:
        'https://www.coursera.org/account/accomplishments/verify/HUNYVIPGYIO0',
      pills: ['google'],
      skills: ['Security Controls', 'SIEM', 'Incident Response'],
    },
    {
      id: 'cert-certiport-java',
      issuer: 'Certiport',
      title: 'IT Specialist in Java',
      credentialUrl: 'https://www.credly.com/users/tanish-misra/badges#credly',
      pills: ['certiport'],
      skills: ['Java'],
    },
  ],
  projects: [
    {
      id: 'project-candle',
      title: 'Candle',
      description:
        'Deployed an all-in-one Choroideremia research intelligence hub, aggregating trials and publications, with a natural language querying interface for patients to receive truthful responses.',
      techStack: ['PostgreSQL', 'pgvector', 'RAG', 'React'],
      githubUrl: 'https://github.com/tanishmisra9/candle',
      pill: 'in-progress',
    },
    {
      id: 'project-01',
      title: 'F1 MultiViewer Director',
      description:
        'Async Python daemon scoring all F1 drivers to rotate onboard camera feeds.',
      techStack: ['Python', 'REST APIs', 'Pydantic'],
      githubUrl: 'https://github.com/tanishmisra9/f1director',
      pill: 'project',
    },
    {
      id: 'project-02',
      title: 'Vendor Master Assistant',
      description:
        'Deployed a 4-agent LangGraph pipeline for deduplicating vendor records using fuzzy matching and GPT-4.',
      techStack: ['Python', 'LangGraph', 'OpenAI', 'MySQL'],
      githubUrl: 'https://github.com/tanishmisra9/VendorOrchestrator',
      pill: 'project',
    },
    {
      id: 'project-portfolio',
      title: 'Personal Portfolio',
      description:
        'Deployed a personal website, leaning into dark mode and minimalism.',
      techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
      githubUrl: 'https://github.com/tanishmisra9/portfolio',
      pill: 'website',
    },
    {
      id: 'project-securify',
      title: 'Securify',
      description:
        'Deployed a fine-tuned RoBERTa NER pipeline that redacts PII before any text reaches the LLM.',
      techStack: [
        'Python',
        'spaCy',
        'PyTorch',
        'FastAPI',
        'LangGraph',
        'React',
        'TypeScript',
        'Tailwind CSS',
      ],
      githubUrl: 'https://github.com/tanishmisra9/securify',
      pill: 'algofest 2026',
    },
    {
      id: 'project-04',
      title: 'Transformer-based PII Extraction',
      description:
        'spaCy Transformer NER pipeline trained on 1M+ synthetic records.',
      techStack: ['Python', 'spaCy', 'PyTorch'],
      githubUrl: 'https://github.com/tanishmisra9/pii-transformer',
      pill: 'internship project',
    },
    {
      id: 'project-tokenwise',
      title: 'Tokenwise',
      description:
        'Agentic orchestration engine that decomposes tasks, routes each subtask to the cheapest capable model, validates quality, and escalates on failure.',
      techStack: [
        'Python',
        'FastAPI',
        'React',
        'SQLite',
        'OpenAI',
        'Anthropic',
        'Docker',
        'Railway',
      ],
      githubUrl: 'https://github.com/tanishmisra9/tokenwise',
      pill: 'global fusion 2026',
    },
    {
      id: 'project-03',
      title: 'Resume Agent',
      description:
        'AI agent generating tailored resume suggestions, featuring a BART zero-shot classification web scraper.',
      techStack: ['Python', 'LangChain', 'Transformers'],
      githubUrl: 'https://github.com/tanishmisra9/resume-agent',
      pill: 'project',
    },
  ],
  aboutBio:
    "I am a student at Purdue learning about applied AI, data pipelines, and building practical machine learning systems that can tackle messy data and real-world constraints from the ground up.\n\nBeyond my technical work, I am deeply fascinated by automotive innovation. I'm also an avid Formula 1 fan (recently building an autonomous broadcast director that automatically rotates onboard cameras to capture the best action), currently developing firmware for Purdue Electric Racing, and enjoy exploring my everyday surroundings through #ShotOniPhone17Pro photography.",
  social: [
    {
      label: 'GitHub',
      href: 'https://github.com/tanishmisra9',
      display: 'github.com/tanishmisra9',
    },
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/tanish-misra',
      display: 'linkedin.com/in/tanish-misra',
    },
    {
      label: 'Email',
      href: 'mailto:tmisra@purdue.edu',
      display: 'tmisra@purdue.edu',
    },
  ],
};
