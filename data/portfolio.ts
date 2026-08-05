import type { PortfolioContent } from '@/types/content';

export const portfolio: PortfolioContent = {
  name: 'TANISH MISRA',
  heroSubtitle:
    'Building practical solutions for real-world constraints.\nCS @ Purdue | Automation Co-op @ Toyota CXD',
  experience: [
    {
      id: 'exp-01',
      date: 'May 2026 - Present',
      org: 'Toyota Connected Experiences Division (CXD)',
      role: 'Automation Co-op',
      tags: ['Software Engineering', 'AI/ML', 'QA'],
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
      date: 'Mar 2024 - Jul 2025',
      org: 'Q Spark Group',
      role: 'Data, Analytics, and AI Intern',
      tags: ['NER Models', 'spaCy', 'Python', 'SQL', 'Pandas'],
    },
    {
      id: 'exp-06',
      date: 'June 2023 - August 2025',
      org: "Karen Dillard's College Prep",
      role: 'Student Worker',
      tags: ['CRM', 'Operations', 'Customer Service', 'Office Administration'],
    },
  ],
  education: [
    {
      id: 'edu-01',
      date: 'Aug 2025 - Dec 2028',
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
          'Discrete Math',
          'The Data Mine',
          'Linear Algebra',
          'Multivariable Calculus',
        ],
      ],
    },
    {
      id: 'edu-01-stats',
      date: 'Aug 2025 - Dec 2028',
      institution: 'Purdue University',
      credential: 'Minor, Statistics',
    },
    {
      id: 'edu-02',
      date: 'May 2025',
      institution: 'Plano West Senior High School',
      credential:
        'Distinguished Level of Achievement, Summa Cum Laude',
      pillRows: [
        [
          'Clarinet player & Logistics Captain',
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
      id: 'cert-google-cyber',
      issuer: 'Google',
      title: 'Google Cybersecurity Certificate',
      pills: ['google'],
      skills: ['OWASP', 'SIEM', 'Network Security', 'Incident Response'],
      courses: [
        {
          title: 'Foundations of Cybersecurity',
          credentialUrl:
            'https://www.coursera.org/account/accomplishments/verify/HUNYVIPGYIO0',
        },
        {
          title: 'Manage Security Risks',
          credentialUrl:
            'https://www.coursera.org/account/accomplishments/verify/SR4FKRAQKNEQ',
        },
        {
          title: 'Networks and Network Security',
          credentialUrl:
            'https://www.coursera.org/account/accomplishments/verify/WVO8VIFCW4UH',
        },
      ],
    },
    {
      id: 'cert-anthropic-academy',
      issuer: 'Anthropic',
      title: 'Anthropic Academy',
      pills: ['anthropic'],
      skills: ['Claude', 'Agent Skills', 'MCP', 'Subagents'],
      courses: [
        {
          title: 'AI Fluency: Framework & Foundations',
          credentialUrl: 'https://verify.skilljar.com/c/y9yk8txvrpzz',
        },
        {
          title: 'Claude 101',
          credentialUrl: 'https://verify.skilljar.com/c/gtthy7hboonf',
        },
        {
          title: 'Claude Code 101',
          credentialUrl: 'https://verify.skilljar.com/c/uuec2qzoim8w',
        },
        {
          title: 'Claude Code in Action',
          credentialUrl: 'https://verify.skilljar.com/c/rrt9vezg6wtk',
        },
        {
          title: 'Introduction to Agent Skills',
          credentialUrl: 'https://verify.skilljar.com/c/qvgzqqh5g8nm',
        },
        {
          title: 'Introduction to Subagents',
          credentialUrl: 'https://verify.skilljar.com/c/m566yornfpov',
        },
        {
          title: 'Introduction to Model Context Protocol',
          credentialUrl: 'https://verify.skilljar.com/c/yo6bb4g8shnb',
        },
      ],
    },
    {
      id: 'cert-umich-c',
      issuer: 'University of Michigan',
      title: 'Programming in C',
      credentialUrl:
        'https://www.coursera.org/account/accomplishments/verify/8O423G7AHCWV',
      pills: ['university of michigan'],
      skills: ['C (Programming Language)', 'Memory Management'],
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
      id: 'cert-certiport-java',
      issuer: 'Certiport',
      title: 'IT Specialist in Java',
      credentialUrl: 'https://www.credly.com/users/tanish-misra/badges#credly',
      pills: ['certiport'],
      skills: ['Java', 'Object-Oriented Programming (OOP)'],
    },
  ],
  projects: [
    {
      id: 'project-candle',
      title: 'Candle (CHM Research Hub)',
      description:
        'Open-source CHM research dashboard aggregating 29 clinical trials and 475 publications into one accessible interface, adopted by CureCHM as an official patient resource at candleforchm.org.',
      techStack: ['PostgreSQL', 'pgvector', 'RAG', 'React'],
      githubUrl: 'https://github.com/tanishmisra9/candle',
      links: [
        { 
          label: 'Website', 
          url: 'https://candleforchm.org' 
        },
        {
          label: 'Press release',
          url: 'https://www.einpresswire.com/article/918493577/choroideremia-research-foundation-highlights-candle-a-patient-developed-resource-hub-advancing-access-to-chm-research',
          icon: 'newspaper',
        },
        ],
      pills: ['research hub'],
    },
    {
      id: 'project-telogify',
      title: 'Telogify',
      description:
        'F1 telemetry pipeline turning a race weekend into deterministic pace, degradation, and deployment insights, delivered as an editorial-brutalist dashboard.',
      techStack: ['PostgreSQL', 'FastAPI', 'LangGraph', 'React', 'TypeScript', 'Tailwind CSS', 'FastF1'],
      githubUrl: 'https://github.com/tanishmisra9/telogify',
      links: [{ label: 'Live site', url: 'https://www.telogify.com' }],
      pills: ['f1', 'website', 'dashboard'],
    },
    {
      id: 'project-01',
      title: 'F1 MultiViewer Director',
      description:
        'Async Python daemon scoring all F1 drivers to rotate onboard camera feeds.',
      techStack: ['Python', 'REST APIs', 'Pydantic'],
      githubUrl: 'https://github.com/tanishmisra9/f1director',
      pills: ['project'],
    },
    {
      id: 'project-02',
      title: 'Vendor Master Assistant',
      description:
        'Deployed a 4-agent LangGraph pipeline for deduplicating vendor records using fuzzy matching and GPT-4.',
      techStack: ['Python', 'LangGraph', 'OpenAI', 'MySQL'],
      githubUrl: 'https://github.com/tanishmisra9/VendorOrchestrator',
      links: [{ label: 'Live site', url: 'https://vendororchestrator-production.up.railway.app' }],
      pills: ['project'],
    },
    {
      id: 'project-portfolio',
      title: 'Personal Portfolio',
      description:
        'Built a personal website, leaning into minimalism.',
      techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
      githubUrl: 'https://github.com/tanishmisra9/portfolio',
      links: [{ label: 'Live site', url: 'https://www.tanishmisra.com' }],
      pills: ['website'],
    },
    {
      id: 'project-securify',
      title: 'Securify',
      description:
        'Semi-finalist at AlgoFest 2026 (200+ submissions); deployed a fine-tuned RoBERTa NER pipeline that redacts PII before any text reaches an LLM.',
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
      links: [{ label: 'Live site', url: 'https://securify-production-136f.up.railway.app' }],
      pills: ['algofest', 'semi-finalist', '2026'],
    },
    {
      id: 'project-04',
      title: 'Transformer-based PII Extraction',
      description:
        'spaCy Transformer NER pipeline trained on 1M+ synthetic records.',
      techStack: ['Python', 'spaCy', 'PyTorch'],
      githubUrl: 'https://github.com/tanishmisra9/pii-transformer',
      pills: ['internship'],
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
      links: [{ label: 'Live site', url: 'https://tokenwise-production.up.railway.app' }],
      pills: ['global fusion', '2026'],
    },
    {
      id: 'project-03',
      title: 'Resume Agent',
      description:
        'AI agent generating tailored resume suggestions, featuring a BART zero-shot classification web scraper.',
      techStack: ['Python', 'LangChain', 'Transformers'],
      githubUrl: 'https://github.com/tanishmisra9/resume-agent',
      pills: ['project'],
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
    {
      label: 'Resume',
      href: '/resume.pdf',
      display: 'Resume',
    },
  ],
};
