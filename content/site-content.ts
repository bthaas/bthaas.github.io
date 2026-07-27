interface ProjectMetric {
  readonly value: string
  readonly label: string
}

interface ProjectCaseStudy {
  readonly brief: string
  readonly approach: string
  readonly focus: string
}

export type ProjectVisualKey = 'courtvision' | 'beatstream' | 'vision-bias-steering'

export interface Project {
  readonly id: string
  readonly visualKey: ProjectVisualKey
  readonly name: string
  readonly description: string
  readonly technologies: readonly string[]
  readonly metrics: readonly ProjectMetric[]
  readonly caseStudy: ProjectCaseStudy
  readonly links: {
    readonly repository: string
  }
}

export interface ExperienceEntry {
  readonly id: string
  readonly organization: string
  readonly role: string
  readonly team: string | null
  readonly period: string
  readonly location: string | null
  readonly summary: string | null
  readonly highlights: readonly string[]
  readonly technologies: readonly string[]
  readonly logo: string | null
}

export interface EducationEntry {
  readonly institution: string
  readonly degree: string
  readonly graduation: string
  readonly location: string
  readonly gpa: string
  readonly coursework: readonly string[]
  readonly focusAreas: readonly string[]
  readonly logo: string
}

export interface SiteContent {
  readonly identity: {
    readonly name: string
    readonly title: string
    readonly location: string
  }
  readonly contact: {
    readonly email: string
    readonly github: string
    readonly linkedin: string
  }
  readonly projects: readonly Project[]
  readonly experience: readonly ExperienceEntry[]
  readonly education: readonly EducationEntry[]
  readonly skills: Readonly<Record<string, readonly string[]>>
}

/** The portfolio's single source of truth. */
export const siteContent = {
  identity: {
    name: 'Brett Haas',
    title: 'Software Engineer',
    location: 'Bellevue, Washington',
  },
  contact: {
    email: 'bthaas15@gmail.com',
    github: 'https://github.com/bthaas',
    linkedin: 'https://linkedin.com/in/brett-haas',
  },
  projects: [
    {
      id: 'courtvision',
      visualKey: 'courtvision',
      name: 'Court Vision',
      description:
        'Computer vision basketball analytics platform for shot tracking and player movement insights.',
      technologies: ['React Native', 'TensorFlow Lite', 'Flask', 'WebSockets', 'AWS EC2'],
      metrics: [
        {
          value: '89%',
          label: 'shot-detection accuracy',
        },
        {
          value: '<200ms',
          label: 'on-device inference latency',
        },
      ],
      caseStudy: {
        brief:
          'Turn basketball footage into practical, coach-friendly signals for reviewing shots, movement, and possession.',
        approach:
          'Extract event-level patterns from video, then organize the results in a focused visualization layer for fast game review.',
        focus:
          'Computer-vision analysis, event pipelines, movement trends, and readable sports analytics.',
      },
      links: {
        repository: 'https://github.com/bthaas/CourtVision',
      },
    },
    {
      id: 'beatstream',
      visualKey: 'beatstream',
      name: 'Beat Stream',
      description:
        'A real-time collaborative music production platform built for low-latency multi-user sessions.',
      technologies: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'WebSockets'],
      metrics: [
        {
          value: '20+',
          label: 'concurrent collaborators',
        },
        {
          value: '<100ms',
          label: 'real-time sync latency',
        },
      ],
      caseStudy: {
        brief:
          'Let musicians produce together in the same browser-based session without collaboration getting in the way.',
        approach:
          'Coordinate multi-user changes through WebSockets, operational transformation, and CRDT-based state management.',
        focus:
          'Low-latency synchronization, complex PostgreSQL session models, and a component-driven Next.js interface.',
      },
      links: {
        repository: 'https://github.com/bthaas/BeatStream',
      },
    },
    {
      id: 'vision-bias-steering',
      visualKey: 'vision-bias-steering',
      name: 'Vision Bias Steering',
      description:
        'LLM steering experiments for shifting model outputs between spatial and descriptive language.',
      technologies: ['Python', 'PyTorch', 'NNSight', 'LLM Evaluation'],
      metrics: [
        {
          value: '616K+',
          label: 'COCO captions filtered',
        },
        {
          value: '28.9%',
          label: 'RMS next-token bias reduction',
        },
        {
          value: '<0.1%',
          label: 'output degeneration',
        },
      ],
      caseStudy: {
        brief:
          'Study whether inference-time steering can shift captions between spatial and descriptive language without retraining model weights.',
        approach:
          'Train and validate steering vectors, run local and multi-model sweeps, then compare language behavior through evaluation and plotting utilities.',
        focus:
          'PyTorch experimentation, NNSight interventions, reproducible sweeps, and language-model evaluation.',
      },
      links: {
        repository: 'https://github.com/bthaas/vision-bias-steering',
      },
    },
  ],
  experience: [
    {
      id: 'uva-ml-research',
      organization: 'University of Virginia',
      role: 'ML Research Assistant',
      team: null,
      period: 'Nov 2025 – May 2026',
      location: 'Charlottesville, VA',
      summary:
        'Inference-time activation-steering research focused on language-model visual bias.',
      highlights: [
        'Built an inference-time activation steering pipeline for LLMs in PyTorch and NNSight, intervening on residual-stream activations across Qwen models with frozen weights.',
        'Engineered a filtering pipeline over 616K+ COCO captions using lexical scoring, next-token probability disparities, and RMSE-based layer selection.',
        'Reduced RMS next-token bias 28.9% while preserving output quality across 1,000 samples.',
      ],
      technologies: ['PyTorch', 'NNSight', 'Activation Steering', 'Interpretability'],
      logo: '/assets/uva-symbol.png',
    },
    {
      id: 'scale-ai',
      organization: 'Scale AI',
      role: 'GenAI Technical Advisor Intern',
      team: 'SEAL',
      period: 'Jun 2025 – Dec 2025',
      location: 'Remote',
      summary:
        'Frontier-model safety, evaluation, and agent reliability work on the Scale AI SEAL team.',
      highlights: [
        'Red-teamed frontier LLMs in Scale AI SEAL, identifying jailbreaks, unsafe behaviors, prompt-injection risks, and agent security failure modes.',
        'Produced RLHF-style code evaluation data for complex software-engineering and competitive-programming tasks.',
        'Improved system prompts and tool use in agentic workflows to increase model safety, consistency, and multi-step reliability.',
      ],
      technologies: ['LLMs', 'RLHF', 'Model Safety', 'Evaluation'],
      logo: '/assets/scale.webp',
    },
    {
      id: 'refraction-innovation-hub',
      organization: 'Refraction Innovation Hub',
      role: 'Software Engineer Intern',
      team: null,
      period: 'Jun 2025 – Aug 2025',
      location: 'McLean, VA',
      summary:
        'Cross-platform nutrition and food-recognition product development across mobile, AI, and cloud systems.',
      highlights: [
        'Architected a cross-platform food recognition app in TypeScript and React Native with OpenAI multimodal APIs.',
        'Deployed authentication through AWS Cognito with storage on AWS RDS and Azure SQL across iOS and Android.',
        'Improved load time 55% and reached 99.5% crash-free sessions through memory optimizations and lazy-loading monitored with AWS CloudWatch.',
      ],
      technologies: ['TypeScript', 'React Native', 'OpenAI', 'AWS'],
      logo: '/assets/refraction.webp',
    },
  ],
  education: [
    {
      institution: 'University of Virginia',
      degree: 'B.S. in Computer Science',
      graduation: 'May 2026',
      location: 'Charlottesville, VA',
      gpa: '3.7',
      coursework: [
        'Computer Systems',
        'Data Structures and Algorithms',
        'Software Engineering',
        'Cybersecurity',
        'Machine Learning',
        'Reinforcement Learning',
      ],
      focusAreas: [
        'Computer Science',
        'Cybersecurity',
        'Machine Learning',
        'Software Engineering',
      ],
      logo: '/assets/uva-symbol.png',
    },
  ],
  skills: {
    Languages: [
      'TypeScript',
      'JavaScript',
      'Python',
      'Java',
      'C/C++',
      'Go',
      'Rust',
      'SQL',
      'Bash',
      'HTML/CSS',
    ],
    Frameworks: [
      'React',
      'Next.js',
      'Node.js',
      'React Native',
      'Flask',
      'PyTorch',
      'TensorFlow',
      'NNSight',
      'Claude Code',
    ],
    'Cloud & DevOps': [
      'AWS',
      'Docker',
      'Kubernetes',
      'CI/CD',
      'Google Cloud',
      'Linux',
    ],
    Databases: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Azure SQL'],
    'AI / ML': [
      'OpenAI API',
      'ML Data Pipelines',
      'RLHF',
      'LLM Evaluation',
      'Activation Steering',
      'Mechanistic Interpretability',
      'Prompt Engineering',
    ],
  },
} as const satisfies SiteContent
