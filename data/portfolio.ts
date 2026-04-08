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
      role: 'Incoming Co-op Intern',
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
      tags: ['Python', 'OpenCV', 'NumPy', 'Docker'],
    },
    {
      id: 'exp-05',
      date: 'June 2023 - August 2025',
      org: "Karen Dillard's College Prep",
      role: 'Student Worker',
      tags: ['CRM', 'Operations'],
    },
    {
      id: 'exp-06',
      date: 'Mar 2024 - Jul 2025',
      org: 'Q Spark Group',
      role: 'Data, Analytics, and AI Intern',
      tags: ['Python', 'SQL', 'Pandas', 'NER Models'],
    },
  ],
  education: [
    {
      id: 'edu-01',
      date: 'Aug 2025 - May 2028',
      institution: 'Purdue University',
      credential: 'B.S. Computer Science (Machine Intelligence & Security)',
      coursework:
        'Relevant Coursework: Problem Solving & OOP, Programming in C, The Data Mine, Linear Algebra, Discrete Math',
      activities:
        'Activities: Purdue Electric Racing, Electric Vehicle Club, Google Developer Group, Claude Builder Club, F1 @ Purdue',
    },
    {
      id: 'edu-02',
      date: 'May 2025',
      institution: 'Plano West Senior High School',
      credential:
        'Distinguished Level of Achievement, High School Diploma (Summa Cum Laude)',
      activities:
        'Activities: Clarinet player & Logistics Captain in the top-level Band program, Senior Officer at AI Club, NHS',
    },
  ],
  skills: [
    {
      id: 'skills-programming',
      category: 'Programming Languages',
      items: ['Python', 'C', 'Java', 'SQL', 'Embedded C'],
    },
    {
      id: 'skills-ml',
      category: 'AI & Machine Learning',
      items: [
        'PyTorch',
        'spaCy',
        'Hugging Face Transformers',
        'LangChain',
        'LangGraph',
        'OpenAI API',
        'OpenCV',
      ],
    },
    {
      id: 'skills-data',
      category: 'Data Tools',
      items: [
        'Pandas',
        'NumPy',
        'Matplotlib',
        'BeautifulSoup4',
        'MySQL',
        'SQLAlchemy',
        'Pydantic',
      ],
    },
    {
      id: 'skills-devtools',
      category: 'Developer Tools',
      items: [
        'Git/GitHub',
        'Docker',
        'REST APIs',
        'Streamlit',
        'STM32',
        'VS Code',
        'IntelliJ',
        'PyCharm',
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
    },
    {
      id: 'cert-google-cyber',
      issuer: 'Google Cybersecurity Certificate',
      title:
        'Foundations of Cybersecurity, Manage Security Risks, Networks & Network Security',
      credentialUrl:
        'https://www.coursera.org/account/accomplishments/verify/HUNYVIPGYIO0',
    },
    {
      id: 'cert-aws-dlai',
      issuer: 'AWS & DeepLearning.AI',
      title: 'Generative AI & Large Language Models',
      credentialUrl:
        'https://www.linkedin.com/in/tanish-misra/details/certifications/',
    },
    {
      id: 'cert-certiport-java',
      issuer: 'Certiport',
      title: 'IT Specialist in Java',
      credentialUrl: 'https://www.credly.com/users/tanish-misra/badges#credly',
    },
  ],
  projects: [
    {
      id: 'project-01',
      title: 'Autonomous F1 Broadcast Director',
      description:
        'Async Python daemon scoring all F1 drivers to rotate onboard camera feeds.',
      techStack: ['Python', 'REST APIs', 'Pydantic'],
      githubUrl: 'https://github.com/tanishmisra9/f1director',
    },
    {
      id: 'project-02',
      title: 'Agentic Vendor Master Assistant',
      description:
        '4-agent LangGraph pipeline for deduplicating vendor records using fuzzy matching and GPT-4.',
      techStack: ['Python', 'LangGraph', 'OpenAI', 'MySQL'],
      githubUrl: 'https://github.com/tanishmisra9/VendorOrchestrator',
    },
    {
      id: 'project-03',
      title: 'Resume Agent',
      description:
        'AI agent generating tailored resume suggestions, featuring a BART zero-shot classification web scraper.',
      techStack: ['Python', 'LangChain', 'Transformers'],
      githubUrl: 'https://github.com/tanishmisra9/resume-agent',
    },
    {
      id: 'project-04',
      title: 'Transformer-based PII Extraction',
      description:
        'Fine-tuned spaCy Transformer NER pipeline trained on 1M+ synthetic records.',
      techStack: ['Python', 'spaCy', 'PyTorch'],
      githubUrl: 'https://github.com/tanishmisra9/pii-transformer',
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
