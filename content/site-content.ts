export interface ContentAsset {
  readonly id: string
  readonly path: `/assets/${string}`
  readonly alt: string
  readonly kind: 'brand' | 'diagram' | 'screenshot'
  readonly context: string
}

export interface Project {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly longDescription: string
  readonly technologies: readonly string[]
  readonly links: {
    readonly repository: string
    readonly live: string | null
  }
  readonly images: readonly string[]
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
  readonly workSamples: readonly string[]
  readonly provenance: 'existing-site' | 'build-brief'
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
    readonly descriptor: string
    readonly location: string
    readonly availability: string
  }
  readonly contact: {
    readonly email: string
    readonly github: string
    readonly linkedin: string
    readonly resume: string | null
  }
  readonly projects: readonly Project[]
  readonly experience: readonly ExperienceEntry[]
  readonly education: readonly EducationEntry[]
  readonly skills: Readonly<Record<string, readonly string[]>>
  readonly assets: readonly ContentAsset[]
  readonly editorial: {
    readonly endingQuote: string
    readonly closingLine: string
  }
}

/**
 * The portfolio's single source of truth.
 *
 * Existing-site copy takes precedence over fallback copy from the Icarus build
 * brief. Entries sourced only from that brief are marked with their provenance.
 * No resume PDF, live-demo URL, project screenshot, favicon, or OG image was
 * present in the repository at extraction time.
 */
export const siteContent = {
  identity: {
    name: 'Brett Haas',
    title: 'Software Engineer',
    descriptor:
      'Full-stack software engineer building reliable, intelligent products across web, mobile, and AI systems.',
    location: 'Charlottesville, Virginia',
    availability: 'Open for opportunities',
  },
  contact: {
    email: 'bthaas15@gmail.com',
    github: 'https://github.com/bthaas',
    linkedin: 'https://linkedin.com/in/brett-haas',
    resume: null,
  },
  projects: [
    {
      id: 'courtvision',
      name: 'Court Vision',
      description:
        'Computer vision basketball analytics platform for shot tracking and player movement insights.',
      longDescription:
        'CourtVision analyzes basketball footage to extract event-level insights like shot attempts, player movement trends, and possession patterns. The project focuses on practical, coach-friendly metrics with a clean visualization layer for fast game review.',
      technologies: ['Computer Vision', 'Python', 'Analytics', 'Sports Tech'],
      links: {
        repository: 'https://github.com/bthaas/CourtVision',
        live: null,
      },
      images: [],
    },
    {
      id: 'beatstream',
      name: 'Beat Stream',
      description:
        'Music streaming and discovery experience focused on smooth playback, curation, and social sharing.',
      longDescription:
        'BeatStream is a modern music web app centered on quick playback, rich discovery, and playlist sharing. The interface emphasizes fast interaction loops and clean information hierarchy so users can move from search to listening with minimal friction.',
      technologies: ['React', 'Audio', 'Streaming', 'UI/UX'],
      links: {
        repository: 'https://github.com/bthaas/BeatStream',
        live: null,
      },
      images: [],
    },
    {
      id: 'vision-bias-steering',
      name: 'Vision Bias Steering',
      description:
        'LLM steering experiments for shifting model outputs between spatial and descriptive language.',
      longDescription:
        'Vision Bias Steering is a research codebase for training, validating, and evaluating steering vectors that shift language-model outputs between spatial and descriptive captioning behavior. It includes local and multi-model sweep runners, evaluation utilities, and plotting workflows built around PyTorch, Transformers, and NNSight.',
      technologies: ['Python', 'PyTorch', 'NNSight', 'LLM Evaluation'],
      links: {
        repository: 'https://github.com/bthaas/vision-bias-steering',
        live: null,
      },
      images: [],
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
      workSamples: [],
      provenance: 'existing-site',
    },
    {
      id: 'scale-ai',
      organization: 'Scale AI',
      role: 'GenAI Technical Advisor Intern',
      team: 'SEAL',
      period: 'Jun 2025 – Dec 2025',
      location: 'Remote, USA',
      summary:
        'Frontier-model safety, evaluation, and agent reliability work on the Scale AI SEAL team.',
      highlights: [
        'Red-teamed frontier LLMs in Scale AI SEAL, identifying jailbreaks, unsafe behaviors, prompt-injection risks, and agent security failure modes.',
        'Produced RLHF-style code evaluation data for complex software-engineering and competitive-programming tasks.',
        'Improved system prompts and tool use in agentic workflows to increase model safety, consistency, and multi-step reliability.',
      ],
      technologies: ['LLMs', 'RLHF', 'Model Safety', 'Evaluation'],
      logo: '/assets/scale.webp',
      workSamples: [],
      provenance: 'existing-site',
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
      workSamples: [
        '/assets/nutridiagram.webp',
        '/assets/analytics1.png',
        '/assets/analytics2.png',
        '/assets/analytics3.png',
      ],
      provenance: 'existing-site',
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
        'Data Structures and Algorithms',
        'Software Development',
        'Software Testing',
        'Computer Systems and Organization',
        'Cybersecurity',
        'Machine Learning Research',
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
    Languages: ['Python', 'Java', 'JavaScript', 'TypeScript', 'C/C++', 'Go', 'Rust', 'SQL'],
    Frameworks: [
      'React',
      'React Native',
      'Node.js',
      'Next.js',
      'Flask',
      'PyTorch',
      'TensorFlow Lite',
      'WebSockets',
    ],
    Infrastructure: ['AWS', 'Docker', 'Kubernetes', 'GCP', 'Firebase', 'PostgreSQL', 'MongoDB'],
    'AI / ML': ['OpenAI API', 'Fine-tuning', 'RLHF', 'LLM Evaluation', 'Activation Steering'],
  },
  assets: [
    {
      id: 'brett-monogram',
      path: '/assets/logo.webp',
      alt: 'Brett Haas BH monogram',
      kind: 'brand',
      context: 'Existing personal mark; optional supporting brand asset.',
    },
    {
      id: 'uva-symbol',
      path: '/assets/uva-symbol.png',
      alt: 'University of Virginia symbol',
      kind: 'brand',
      context: 'UVA education and ML research entries.',
    },
    {
      id: 'scale-logo',
      path: '/assets/scale.webp',
      alt: 'Scale AI logo',
      kind: 'brand',
      context: 'Scale AI experience entry.',
    },
    {
      id: 'refraction-logo',
      path: '/assets/refraction.webp',
      alt: 'Refraction Innovation Hub logo',
      kind: 'brand',
      context: 'Refraction Innovation Hub experience entry.',
    },
    {
      id: 'nutrition-architecture',
      path: '/assets/nutridiagram.webp',
      alt: 'Architecture diagram for a React Native nutrition app using OpenAI and SQLite',
      kind: 'diagram',
      context: 'Refraction food-recognition app work sample.',
    },
    {
      id: 'nutrition-analytics-detail',
      path: '/assets/analytics1.png',
      alt: 'Mobile nutrition app showing macro distribution and detailed nutrition analytics',
      kind: 'screenshot',
      context: 'Refraction food-recognition app work sample.',
    },
    {
      id: 'nutrition-progress',
      path: '/assets/analytics2.png',
      alt: 'Mobile nutrition app showing weekly progress and a weight trend',
      kind: 'screenshot',
      context: 'Refraction food-recognition app work sample.',
    },
    {
      id: 'nutrition-daily-summary',
      path: '/assets/analytics3.png',
      alt: 'Mobile nutrition app showing a daily calorie, macronutrient, and water summary',
      kind: 'screenshot',
      context: 'Refraction food-recognition app work sample.',
    },
  ],
  editorial: {
    endingQuote: 'I laughed as I fell, for I had soared.',
    closingLine: 'Keep Building.',
  },
} as const satisfies SiteContent
