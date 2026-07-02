export type PipelineStageId =
  | "applied"
  | "screening"
  | "technical_test"
  | "interview"
  | "offering"
  | "hired"
  | "rejected";

export type CandidateScore = {
  label: string;
  value: number;
  maxValue: number;
};

export type Candidate = {
  id: string;
  name: string;
  role: string;
  stageId: PipelineStageId;
  avatarUrl?: string;
  location?: string;
  experienceYears?: number;
  techStack: string[];
  scores?: CandidateScore[];
  lastUpdatedAt: string;
};

export type PipelineStage = {
  id: PipelineStageId;
  title: string;
  description?: string;
};

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "applied", title: "Applied", description: "New applications received" },
  { id: "screening", title: "Screening", description: "Initial resume & profile review" },
  { id: "technical_test", title: "Technical Test", description: "Coding challenge and assessment" },
  { id: "interview", title: "Interview", description: "Technical & cultural interview phases" },
  { id: "offering", title: "Offering", description: "Salary negotiation & job offer extended" },
  { id: "hired", title: "Hired", description: "Successfully signed and hired" },
  { id: "rejected", title: "Rejected", description: "Unsuitable candidates for this position" },
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "cand-1",
    name: "Nguyen Minh Quan",
    role: "React Developer",
    stageId: "applied",
    location: "Ho Chi Minh City",
    experienceYears: 3,
    techStack: ["React", "TypeScript", "Tailwind CSS"],
    lastUpdatedAt: "2026-06-30T10:00:00Z",
  },
  {
    id: "cand-2",
    name: "Tran Thi Hoa",
    role: "React Developer",
    stageId: "screening",
    location: "Da Nang",
    experienceYears: 4,
    techStack: ["ReactJS", "Next.js", "Redux Toolkit"],
    lastUpdatedAt: "2026-06-29T14:30:00Z",
  },
  {
    id: "cand-3",
    name: "Pham Hoang Nam",
    role: "Node.js Developer",
    stageId: "technical_test",
    location: "Hanoi",
    experienceYears: 5,
    techStack: ["NodeJS", "Express", "PostgreSQL", "Prisma"],
    scores: [
      { label: "Backend Test", value: 85, maxValue: 100 },
      { label: "SQL Assessment", value: 9, maxValue: 10 },
    ],
    lastUpdatedAt: "2026-06-28T09:15:00Z",
  },
  {
    id: "cand-4",
    name: "Le Quoc Bao",
    role: "DevOps Engineer",
    stageId: "interview",
    location: "Ho Chi Minh City",
    experienceYears: 6,
    techStack: ["Docker", "Kubernetes", "AWS", "Terraform"],
    scores: [{ label: "Infrastructure Q&A", value: 92, maxValue: 100 }],
    lastUpdatedAt: "2026-06-27T16:45:00Z",
  },
  {
    id: "cand-5",
    name: "Hoang Thu Thao",
    role: "QA Engineer",
    stageId: "offering",
    location: "Hanoi",
    experienceYears: 2,
    techStack: ["Selenium", "Playwright", "Jest", "TypeScript"],
    scores: [
      { label: "Automation Coding", value: 78, maxValue: 100 },
      { label: "QA Fundamentals", value: 8.5, maxValue: 10 },
    ],
    lastUpdatedAt: "2026-06-29T11:20:00Z",
  },
  {
    id: "cand-6",
    name: "Doan Manh Dung",
    role: "Node.js Developer",
    stageId: "hired",
    location: "Da Nang",
    experienceYears: 7,
    techStack: ["NodeJS", "NestJS", "MongoDB", "Redis", "Docker"],
    scores: [{ label: "System Design", value: 95, maxValue: 100 }],
    lastUpdatedAt: "2026-06-25T15:00:00Z",
  },
  {
    id: "cand-7",
    name: "Nguyen Khanh Linh",
    role: "React Developer",
    stageId: "rejected",
    location: "Hanoi",
    experienceYears: 1,
    techStack: ["React", "JavaScript", "CSS3"],
    scores: [{ label: "Basic JS Test", value: 45, maxValue: 100 }],
    lastUpdatedAt: "2026-06-26T14:10:00Z",
  },
  {
    id: "cand-8",
    name: "Vu Hoang Hai",
    role: "DevOps Engineer",
    stageId: "applied",
    location: "Remote",
    experienceYears: 4,
    techStack: ["CI/CD", "GitHub Actions", "AWS", "Python"],
    lastUpdatedAt: "2026-06-30T08:50:00Z",
  },
  {
    id: "cand-9",
    name: "Dinh Thi Quynh",
    role: "QA Engineer",
    stageId: "screening",
    location: "Ho Chi Minh City",
    experienceYears: 3,
    techStack: ["Manual Testing", "API Testing", "Postman", "SQL"],
    lastUpdatedAt: "2026-06-30T12:00:00Z",
  },
  {
    id: "cand-10",
    name: "Bui Thanh Tung",
    role: "React Developer",
    stageId: "interview",
    location: "Ho Chi Minh City",
    experienceYears: 5,
    techStack: ["React", "Next.js", "Zustand", "Tailwind CSS"],
    scores: [{ label: "Frontend Challenge", value: 88, maxValue: 100 }],
    lastUpdatedAt: "2026-06-29T17:10:00Z",
  },
];
