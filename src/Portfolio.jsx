import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink,
  Zap,
  Box,
  Layers,
  Smartphone,
  Brain,
  Coffee,
  PenTool,
  MousePointer2,
  X,
  Server,
  ShieldCheck,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const projects = [
  {
    id: 'go-secure-sandbox',
    title: "Secure Code Sandbox API",
    description: "High-performance API for running untrusted code with hardware-level isolation via Firecracker microVMs.",
    longDescription: "A production-ready API for securely executing user-provided code snippets in isolated MicroVM environments using Firecracker. Designed for AI agents and other applications that need to safely run untrusted code with strict resource limits (CPU, memory, PIDs) and network isolation. The system uses the same technology that powers AWS Lambda for sub-150ms cold starts.",
    icon: <ShieldCheck className="text-green-500" />,
    tags: ["Go", "Firecracker", "MicroVMs", "Security"],
    color: "border-green-200 bg-green-50/50",
    url: "https://github.com/bthaas/go-secure-sandbox"
  },
  {
    id: 'courtvision',
    title: "CourtVision",
    description: "Computer vision basketball analytics platform for shot tracking and player movement insights.",
    longDescription: "CourtVision analyzes basketball footage to extract event-level insights like shot attempts, player movement trends, and possession patterns. The project focuses on practical, coach-friendly metrics with a clean visualization layer for fast game review.",
    icon: <Brain className="text-purple-500" />,
    tags: ["Computer Vision", "Python", "Analytics", "Sports Tech"],
    color: "border-purple-200 bg-purple-50/50",
    url: "https://github.com/bthaas/CourtVision"
  },
  {
    id: 'beatstream',
    title: "BeatStream",
    description: "Music streaming and discovery experience focused on smooth playback, curation, and social sharing.",
    longDescription: "BeatStream is a modern music web app centered on quick playback, rich discovery, and playlist sharing. The interface emphasizes fast interaction loops and clean information hierarchy so users can move from search to listening with minimal friction.",
    icon: <Smartphone className="text-pink-500" />,
    tags: ["React", "Audio", "Streaming", "UI/UX"],
    color: "border-pink-200 bg-pink-50/50",
    url: "https://github.com/bthaas/BeatStream"
  },
  {
    id: 'apex-vector',
    title: "ApexVector",
    description: "A high-performance, distributed vector database built from scratch in Rust with HNSW indexing.",
    longDescription: "A high-performance, persistent, approximate nearest neighbor (ANN) search vector database written in Rust. It implements the HNSW (Hierarchical Navigable Small World) algorithm with scalar quantization for 4x memory compression and features an ACID-compliant, durable storage engine using Write-Ahead Logging (WAL). The high-performance API is built with Tonic/Protobuf.",
    icon: <Database className="text-slate-500" />,
    tags: ["Rust", "Vector Database", "HNSW", "gRPC"],
    color: "border-slate-200 bg-slate-50/50",
    url: "https://github.com/bthaas/apex-vector"
  },
  {
    id: 'raft-kv-store',
    title: "Distributed Key-Value Store",
    description: "A fault-tolerant, distributed key-value store built in Go using the Raft consensus algorithm.",
    longDescription: "A fault-tolerant, horizontally scalable Key-Value Store built in Go using the Raft consensus algorithm. Features include strong consistency via Raft (Leader Election, Log Replication), fault tolerance for node failures, and persistence with a Write-Ahead Log (WAL) for crash recovery. The architecture handles leader election with randomized timers, maintains authority with heartbeats, and replicates logs to a majority of followers before committing them to an in-memory store.",
    icon: <Server className="text-orange-500" />,
    tags: ["Go", "Raft Consensus", "Distributed Systems"],
    color: "border-orange-200 bg-orange-50/50",
    url: "https://github.com/bthaas/raft-kv-store"
  },
];

/**
 * Brett Haas Portfolio
 * A "Digital Workspace" aesthetic portfolio.
 * * Features:
 * - "Physical" card interactions (hover lift, shadows)
 * - Dot grid background for technical/architectural feel
 * - Draggable-feeling layout (simulated via layout)
 * - Neo-brutalist/Pop design touches
 */

const Portfolio = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % projects.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const sectionIds = ['hero', 'experience', 'projects', 'skills'];

    const updateScrollState = () => {
      const marker = window.innerHeight * 0.35;
      let closestId = sectionIds[0];
      let closestDistance = Number.POSITIVE_INFINITY;

      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        const distance = Math.abs(section.getBoundingClientRect().top - marker);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = id;
        }
      });

      setActiveSection(closestId);

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollProgress(Math.max(0, Math.min(progress, 1)));
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Patterns */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.4]" 
           style={{ 
             backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
             backgroundSize: '24px 24px',
             backgroundPosition: `0px ${scrollProgress * 160}px`
           }} 
      />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(79,70,229,0.45) 0%, rgba(79,70,229,0) 70%)',
            transform: `translate3d(${mousePos.x * 28}px, ${scrollProgress * 140}px, 0)`
          }}
        />
        <div
          className="absolute -bottom-40 -right-28 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(14,165,233,0.45) 0%, rgba(14,165,233,0) 72%)',
            transform: `translate3d(${mousePos.x * -20}px, ${scrollProgress * -120}px, 0)`
          }}
        />
      </div>
      
      {/* Floating Ambient "Physical" Objects */}
      <div className="fixed top-20 right-20 animate-float-slow z-0 opacity-20 rotate-12 hidden lg:block">
        <Box size={120} strokeWidth={1} />
      </div>
      <div className="fixed bottom-40 left-10 animate-float-slower z-0 opacity-20 -rotate-12 hidden lg:block">
        <Layers size={100} strokeWidth={1} />
      </div>

      {/* Navigation - Floating Dock Style */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full flex gap-6 items-center transition-all hover:scale-105 hover:bg-white">
        {[
          { id: 'hero', icon: <MousePointer2 size={20} />, label: 'Start' },
          { id: 'experience', icon: <Briefcase size={20} />, label: 'Work' },
          { id: 'projects', icon: <Code2 size={20} />, label: 'Builds' },
          { id: 'skills', icon: <Cpu size={20} />, label: 'Tech' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`relative group p-2 rounded-full transition-all duration-300 ${activeSection === item.id ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'hover:bg-slate-100 text-slate-500 hover:text-indigo-600'}`}
          >
            {item.icon}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-32">

        {/* HERO SECTION */}
        <section id="hero" className="min-h-[80vh] flex flex-col justify-center relative">
          
          {/* Decorative Top Bar */}
          <div className="absolute top-0 left-0 w-full flex justify-between items-center opacity-50 font-mono text-xs tracking-widest uppercase">
            <span>Portfolio v2.1 // 2026</span>
            <span>UVA_CS_26</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-8 transition-all duration-1000 transform ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium animate-pulse-slow">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                Open for opportunities
              </div>

              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
                Brett <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Haas</span>.
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 max-w-lg leading-relaxed">
                Full-stack engineer & creative technologist building intelligent systems. 
              </p>

              <div className="flex gap-4 pt-4">
                <SocialButton href="https://github.com/bthaas" icon={<Github />} label="GitHub" />
                <SocialButton href="https://linkedin.com/in/brett-haas" icon={<Linkedin />} label="LinkedIn" />
                <SocialButton href="mailto:bthaas15@gmail.com" icon={<Mail />} label="Email" />
              </div>
            </div>

            {/* Interactive "Card" Stack Visual */}
            <div className="relative h-[400px] hidden lg:flex items-center justify-center perspective-1000">
              {/* Abstract Resume Card */}
              <div 
                className="absolute w-72 h-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-6 transform transition-transform duration-200 ease-out flex flex-col justify-between overflow-hidden"
                style={{
                  transform: `rotateY(${mousePos.x * 10}deg) rotateX(${mousePos.y * -10}deg) rotateZ(-6deg)`,
                  boxShadow: `${mousePos.x * -20}px ${mousePos.y * 20}px 40px rgba(0,0,0,0.1)`
                }}
              >
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Code2 size={120} />
                 </div>
                 <div>
                    <img src="https://cdn.simpleicons.org/github/0f172a" alt="GitHub" className="w-12 h-12 bg-white rounded-lg mb-4 p-2 shadow-sm border border-slate-200" />
                    <div className="h-2 w-24 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                 </div>
                 <div className="space-y-2">
                    <div className="h-16 w-full bg-indigo-50 rounded border border-indigo-100 p-2">
                        <div className="h-2 w-8 bg-indigo-200 rounded mb-1"></div>
                        <div className="h-1 w-full bg-indigo-100 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                        <img src="https://cdn.simpleicons.org/javascript/f7df1e" alt="JavaScript" className="h-8 w-8 rounded-full bg-white border-2 border-white shadow-sm p-1" />
                        <img src="https://cdn.simpleicons.org/python/3776ab" alt="Python" className="h-8 w-8 rounded-full bg-white border-2 border-white shadow-sm p-1" />
                        <img src="https://cdn.simpleicons.org/react/61DAFB" alt="React" className="h-8 w-8 rounded-full bg-white border-2 border-white shadow-sm p-1" />
                    </div>
                 </div>
              </div>

              {/* Floating "Sticker" Elements */}
              <div className="absolute -top-10 right-20 bg-yellow-300 text-yellow-900 px-4 py-2 rounded-lg font-bold shadow-lg transform rotate-12 animate-float">
                CS @ UVA '26
              </div>
              <div className="absolute bottom-10 left-10 bg-black text-white px-4 py-2 rounded-lg font-mono text-sm shadow-xl transform -rotate-6 animate-float-delayed">
                &lt;Coder /&gt;
              </div>
            </div>
          </div>
        </section>

        {/* EXPERIENCE SECTION */}
        <section id="experience" className="relative">
          <SectionHeader title="Experience" subtitle="Where I've made an impact" icon={<Briefcase />} />
          
          <div className="mt-12 space-y-12 relative">
            {/* Connecting Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-400 to-transparent transform -translate-x-1/2 hidden md:block" />

            {/* Experience Items */}
            <ExperienceCard 
              company="Scale AI"
              role="GenAI Technical Advisor Intern"
              period="Jun 2025 - Dec 2025"
              location="Remote"
              logo="S"
              color="bg-slate-900"
              side="left"
              content={[
                "Fine-tuned LLMs on competitive programming & algorithmic tasks.",
                "Designed benchmarks for reasoning, accuracy, and agentic behavior.",
                "Conducted red-teaming to identify jailbreak vulnerabilities.",
                "Collaborated with ML engineers to debug failure modes."
              ]}
              tech={["LLMs", "Python", "RLHF", "Evaluation"]}
            />

            <ExperienceCard 
              company="Refraction Innovation Hub"
              role="Software Engineer Intern"
              period="Jun 2025 - Aug 2025"
              location="Tysons Corner, VA"
              logo="R"
              color="bg-blue-600"
              side="right"
              content={[
                "Built multimodal food recognition app with React Native.",
                "Integrated OpenAI APIs for 1.2s inference speed.",
                "Optimized load time by 55% and achieved 99.5% crash-free sessions.",
                "Implemented AWS Cognito auth and Azure SQL storage."
              ]}
              tech={["React Native", "OpenAI", "AWS", "Azure"]}
            />
          </div>
        </section>

        {/* PROJECTS SECTION */}
        <section id="projects">
          <SectionHeader title="Selected Works" subtitle="Things I've built from scratch" icon={<Code2 />} />

          <ProjectSpotlight
            projects={projects}
            activeIndex={spotlightIndex}
            onSelect={setSpotlightIndex}
            onOpen={(project) => setSelectedProject(project)}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id}
                onOpen={() => setSelectedProject(project)}
                {...project}
              />
            ))}
          </div>
        </section>

        {/* SKILLS SECTION */}
        <section id="skills" className="pb-32">
          <SectionHeader title="Technical Arsenal" subtitle="Tools of the trade" icon={<Cpu />} />
          
          <div className="mt-12 bg-white rounded-2xl border border-slate-200 shadow-xl p-8 relative overflow-hidden">
            {/* Decorative background grid inside card */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                   backgroundSize: '20px 20px' 
                 }} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              <SkillGroup 
                title="Languages" 
                icon={<Terminal size={18} />}
                skills={["Python", "Java", "TypeScript", "C/C++", "Go", "Rust", "SQL"]} 
              />
              <SkillGroup 
                title="Frameworks" 
                icon={<Layers size={18} />}
                skills={["React", "React Native", "Node.js", "Next.js", "Flask", "PyTorch"]} 
              />
              <SkillGroup 
                title="Infrastructure" 
                icon={<Box size={18} />}
                skills={["AWS", "Docker", "Kubernetes", "GCP", "PostgreSQL", "MongoDB"]} 
              />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-white text-2xl font-bold mb-2">Brett Haas</h2>
            <p className="text-sm">Built with React, Tailwind & ❤️ in Charlottesville.</p>
          </div>
          <div className="flex gap-6">
            <a href="mailto:bthaas15@gmail.com" className="hover:text-white transition-colors">Contact</a>
            <a href="https://github.com/bthaas" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://linkedin.com/in/brett-haas" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
        {/* Giant background text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold text-white opacity-[0.02] whitespace-nowrap pointer-events-none select-none">
          BRETT HAAS
        </div>
      </footer>

      {selectedProject && (
        <ProjectModal 
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

/* --- Sub Components --- */

const SectionHeader = ({ title, subtitle, icon }) => (
  <div className="flex items-start gap-4 mb-8">
    <div className="p-3 bg-white rounded-xl shadow-md border border-slate-100 text-indigo-600">
      {icon}
    </div>
    <div>
      <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-1 font-medium">{subtitle}</p>
    </div>
  </div>
);

const SocialButton = ({ href, icon, label }) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 hover:text-indigo-600 transition-all active:scale-95"
  >
    {icon}
    <span className="font-medium">{label}</span>
  </a>
);

const ExperienceCard = ({ company, role, period, location, logo, color, side, content, tech }) => (
  <div className={`flex flex-col md:flex-row items-center gap-8 ${side === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
    
    {/* Timeline Node */}
    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-4 border-indigo-500 rounded-full z-10 shadow-lg" />

    {/* Content Card */}
    <div className={`w-full md:w-[calc(50%-2rem)] group hover:-translate-y-1 transition-transform duration-300`}>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden">
        {/* Top Accent Bar */}
        <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
        
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${color} text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-md`}>
              {logo}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{company}</h3>
              <p className="text-sm text-slate-500 font-medium">{role}</p>
            </div>
          </div>
          <div className="text-right">
             <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{period}</span>
             <span className="block text-xs text-slate-400 mt-1">{location}</span>
          </div>
        </div>

        <ul className="space-y-2 mb-6">
          {content.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
          {tech.map((t, i) => (
            <span key={i} className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded border border-slate-100">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ProjectCard = ({ title, description, icon, tags, color, onOpen, url }) => (
  <div 
    onClick={onOpen}
    className={`group bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl border transition-all duration-300 hover:-translate-y-2 h-full flex flex-col justify-between relative overflow-hidden cursor-pointer ${color}`}
  >
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          {icon}
        </div>
        <a 
          href={url}
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-slate-400 hover:text-indigo-600 transition-colors relative z-20"
        >
          <ExternalLink size={20} />
        </a>
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed mb-5">
        {description}
      </p>

    </div>

    <div className="flex flex-wrap gap-2 relative z-10">
      {tags.map((tag, i) => (
        <span key={i} className="px-2 py-1 bg-white/80 backdrop-blur text-slate-700 text-xs font-semibold rounded-md shadow-sm border border-slate-100">
          {tag}
        </span>
      ))}
    </div>

    {/* Artistic Circle Background */}
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-current opacity-[0.05] rounded-full" />
  </div>
);

const ProjectSpotlight = ({ projects, activeIndex, onSelect, onOpen }) => {
  const project = projects[activeIndex];

  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <button
          onClick={() => onOpen(project)}
          className="relative h-72 lg:h-full min-h-72 overflow-hidden group bg-gradient-to-br from-slate-50 to-white border-r border-slate-100 flex items-center justify-center"
        >
          <div className="absolute inset-0 opacity-40"
               style={{
                 backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                 backgroundSize: '18px 18px'
               }}
          />
          <div className="relative z-10 w-40 h-40 rounded-3xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform duration-300">
            {React.cloneElement(project.icon, {
              size: 88,
              className: `${project.icon.props.className || ''} drop-shadow-sm`
            })}
          </div>
          <div className="absolute bottom-4 left-4 text-slate-500 text-sm font-semibold tracking-wide">
            Tap to open project
          </div>
        </button>

        <div className="p-8 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-6">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Project Spotlight
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelect((activeIndex - 1 + projects.length) % projects.length)}
                className="p-2 rounded-full border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => onSelect((activeIndex + 1) % projects.length)}
                className="p-2 rounded-full border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <h3 className="text-3xl font-bold text-slate-900 mb-3">{project.title}</h3>
          <p className="text-slate-600 leading-relaxed mb-6">{project.description}</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={() => onOpen(project)}
            className="self-start px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            View Details
          </button>

          <div className="mt-6 flex gap-2">
            {projects.map((item, i) => (
              <button
                key={item.id}
                onClick={() => onSelect(i)}
                aria-label={`Show ${item.title}`}
                className={`h-2.5 rounded-full transition-all ${i === activeIndex ? 'w-8 bg-indigo-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillGroup = ({ title, skills, icon }) => (
  <div>
    <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase tracking-wider text-xs">
      {icon}
      {title}
    </div>
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, i) => (
        <span 
          key={i}
          className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg text-sm font-medium transition-colors cursor-default"
        >
          {skill}
        </span>
      ))}
    </div>
  </div>
);

const ProjectModal = ({ project, onClose }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 z-20"
        >
          <X size={20} />
        </button>

        <div className="h-64 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-white border-b border-slate-200 flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-40"
               style={{
                 backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                 backgroundSize: '18px 18px'
               }}
          />
          <div className="relative z-10 w-36 h-36 rounded-3xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-indigo-600">
            {React.cloneElement(project.icon, {
              size: 80,
              className: `${project.icon.props.className || ''} drop-shadow-sm`
            })}
          </div>
        </div>

        <div className="p-8 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-2 text-slate-900">{project.title}</h2>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                {tag}
              </span>
            ))}
          </div>
          
          <p className="text-slate-600 leading-relaxed text-base">
            {project.longDescription}
          </p>

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-7 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            View on GitHub
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </div>
  );
};

// CSS Keyframes for custom animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(12deg); }
    50% { transform: translateY(-10px) rotate(12deg); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(-6deg); }
    50% { transform: translateY(-10px) rotate(-6deg); }
  }
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  @keyframes float-slower {
    0%, 100% { transform: translateY(0px) rotate(-12deg); }
    50% { transform: translateY(-15px) rotate(-8deg); }
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  .animate-float { animation: float 4s ease-in-out infinite; }
  .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; }
  .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
  .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
  .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
  
  .perspective-1000 { perspective: 1000px; }
`;
document.head.appendChild(style);

export default Portfolio;
