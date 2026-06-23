export type ProfileJob = {
  id: string;
  title: string;
  company: string;
  logo: string;
  salary: string;
  location: string;
  level: string;
  applicants: number;
  tags: string[];
  posted: string;
};

const logo = (file: string) => `/assets/marketing/home/companies/${file}`;

export const profileJobs: ProfileJob[] = [
  {
    id: "fpt-java-fresher",
    title: "Fresher Java Developer",
    company: "FPT Software",
    logo: logo("fpt.png"),
    salary: "10 - 15 triệu/tháng",
    location: "TP. Hồ Chí Minh",
    level: "Fresher",
    applicants: 40,
    tags: ["Java", "Spring Boot", "SQL", "OOP"],
    posted: "2 ngày trước",
  },
  {
    id: "momo-mobile-react",
    title: "Mobile Developer React Native",
    company: "MoMo",
    logo: logo("momo.png"),
    salary: "25 - 40 triệu/tháng",
    location: "Hà Nội",
    level: "Middle",
    applicants: 24,
    tags: ["React Native", "Mobile", "TypeScript"],
    posted: "1 ngày trước",
  },
  {
    id: "vng-frontend-senior",
    title: "Senior Frontend Developer",
    company: "VNG Corporation",
    logo: logo("vng.png"),
    salary: "35 - 55 triệu/tháng",
    location: "TP. Hồ Chí Minh",
    level: "Senior",
    applicants: 18,
    tags: ["React", "Next.js", "Design System"],
    posted: "3 ngày trước",
  },
  {
    id: "tiki-data-analyst",
    title: "Data Analyst",
    company: "Tiki",
    logo: logo("tiki.png"),
    salary: "22 - 35 triệu/tháng",
    location: "Hybrid",
    level: "Middle",
    applicants: 31,
    tags: ["SQL", "BI", "Python"],
    posted: "5 ngày trước",
  },
  {
    id: "vnpay-devops-engineer",
    title: "DevOps Engineer",
    company: "VNPAY",
    logo: logo("vnpay.png"),
    salary: "30 - 50 triệu/tháng",
    location: "Hà Nội",
    level: "Senior",
    applicants: 16,
    tags: ["Kubernetes", "AWS", "CI/CD"],
    posted: "1 tuần trước",
  },
  {
    id: "viettel-ai-engineer",
    title: "AI Engineer",
    company: "Viettel Digital",
    logo: logo("viettel.png"),
    salary: "40 - 70 triệu/tháng",
    location: "Hà Nội",
    level: "Senior",
    applicants: 12,
    tags: ["LLM", "Python", "MLOps"],
    posted: "1 tuần trước",
  },
];
