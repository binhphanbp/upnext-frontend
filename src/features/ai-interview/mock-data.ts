import { RolePreset, InterviewQuestion, InterviewEvaluationReport } from "./types";

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "frontend-developer",
    category: "frontend",
    title: "Senior Frontend Developer",
    titleVi: "Lập trình viên Frontend (React/Next.js)",
    description:
      "Deep dive into React 19, Next.js App Router, Performance Optimization, State Management & Modern CSS.",
    descriptionVi:
      "Phỏng vấn chuyên sâu React 19, Next.js App Router, Tối ưu hiệu năng Core Web Vitals, Quản lý State & Kiến trúc Frontend.",
    iconName: "Code",
    tags: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Web Vitals"],
    recommendedLevel: "senior",
    totalQuestions: 5,
    durationMinutes: 20,
  },
  {
    id: "backend-engineer",
    category: "backend",
    title: "Backend Platform Engineer",
    titleVi: "Kỹ sư Backend (Node.js/NestJS/Go)",
    description:
      "Covers REST & gRPC APIs, Microservices, PostgreSQL indexing, Redis caching, Message Queues & Security.",
    descriptionVi:
      "Kiến trúc Microservices, Tối ưu cơ sở dữ liệu PostgreSQL, Caching Redis, Message Queue Kafka/RabbitMQ và Bảo mật API.",
    iconName: "Server",
    tags: ["NestJS", "PostgreSQL", "Redis", "Kafka", "Docker"],
    recommendedLevel: "mid",
    totalQuestions: 5,
    durationMinutes: 20,
  },
  {
    id: "fullstack-developer",
    category: "fullstack",
    title: "Fullstack Web Engineer",
    titleVi: "Lập trình viên Fullstack (React + Node.js)",
    description:
      "End-to-end web development, API design, SSR/SSG rendering, database modeling and cloud deployment.",
    descriptionVi:
      "Phát triển toàn diện từ giao diện đến máy chủ, thiết kế API, mô hình hoá dữ liệu và triển khai Cloud.",
    iconName: "Layers",
    tags: ["TypeScript", "Next.js", "NestJS", "Prisma", "Postgres"],
    recommendedLevel: "mid",
    totalQuestions: 5,
    durationMinutes: 20,
  },
  {
    id: "ai-engineer",
    category: "ai-ml",
    title: "AI & Machine Learning Engineer",
    titleVi: "Kỹ sư Trí tuệ Nhân tạo & LLMs",
    description:
      "LLM fine-tuning, RAG pipelines, Vector Databases, Prompt Engineering, LangChain and AI Agent systems.",
    descriptionVi:
      "Xây dựng hệ thống RAG, Vector Search, Tối ưu LLM, Thiết kế AI Agent và triển khai mô hình AI thực tế.",
    iconName: "BrainCircuit",
    tags: ["LLM", "RAG", "Python", "Vector DB", "LangChain"],
    recommendedLevel: "senior",
    totalQuestions: 5,
    durationMinutes: 25,
  },
  {
    id: "devops-engineer",
    category: "devops",
    title: "DevOps & Cloud Engineer",
    titleVi: "Kỹ sư DevOps & Điện toán Đám mây",
    description:
      "CI/CD pipelines, Kubernetes orchestration, Docker, AWS/GCP infrastructure as code (Terraform), and Observability.",
    descriptionVi:
      "Xây dựng CI/CD, Quản trị cụm Kubernetes, Tự động hóa hạ tầng Terraform trên AWS/GCP và Giám sát hệ thống.",
    iconName: "Cloud",
    tags: ["Kubernetes", "Docker", "AWS", "CI/CD", "Terraform"],
    recommendedLevel: "mid",
    totalQuestions: 5,
    durationMinutes: 20,
  },
  {
    id: "uiux-designer",
    category: "ui-ux",
    title: "Product / UI-UX Designer",
    titleVi: "Chuyên viên Thiết kế Sản phẩm UI/UX",
    description:
      "User research, design systems in Figma, prototyping, wireframing, usability testing & design-to-code handover.",
    descriptionVi:
      "Nghiên cứu người dùng, Xây dựng Design System chuẩn chỉ trong Figma, Prototype tương tác và Kiểm thử UX.",
    iconName: "Palette",
    tags: ["Figma", "Design System", "User Research", "Wireframing", "UX Audit"],
    recommendedLevel: "mid",
    totalQuestions: 5,
    durationMinutes: 15,
  },
];

export const MOCK_QUESTIONS_BY_ROLE: Record<string, InterviewQuestion[]> = {
  "frontend-developer": [
    {
      id: "q1",
      order: 1,
      category: "Performance Optimization",
      categoryVi: "Tối ưu hóa Hiệu năng",
      difficulty: "medium",
      question:
        "How would you optimize a React/Next.js application for maximum performance and Core Web Vitals?",
      questionVi:
        "Bạn sẽ tối ưu một ứng dụng React/Next.js như thế nào để đạt hiệu năng tối đa và tối ưu các chỉ số Core Web Vitals?",
      keyTopics: [
        "Code splitting",
        "useMemo / useCallback",
        "Dynamic imports",
        "Image optimization",
        "SSR/SSG",
      ],
      idealPoints: [
        "Use dynamic imports and code splitting to reduce initial bundle size.",
        "Leverage Next.js Image component for automatic WebP/AVIF format and responsive sizing.",
        "Implement proper React memoization (useMemo, useCallback) and avoid unnecessary re-renders.",
        "Optimize LCP, FID/INP, and CLS through critical CSS and font preloading.",
      ],
      idealPointsVi: [
        "Áp dụng code splitting và dynamic imports để giảm dung lượng bundle ban đầu.",
        "Tận dụng component next/image để tự động nén WebP/AVIF và tải ảnh theo kích thước màn hình.",
        "Sử dụng useMemo, useCallback hợp lý và tránh re-render không cần thiết ở component cha.",
        "Tối ưu các chỉ số LCP, INP, CLS thông qua tải trước font và critical CSS.",
      ],
      sampleAnswer:
        "I use code-splitting, lazy loading, memoization (React.memo, useMemo), and avoid unnecessary re-renders with proper dependency handling in hooks.",
      sampleAnswerVi:
        "Tôi kết hợp chia nhỏ bundle bằng dynamic import, lazy loading các component nặng, kiểm soát re-render bằng useMemo/useCallback và tối ưu tài nguyên tĩnh qua CDN.",
      status: "answered",
      score: 92,
      feedbackVi:
        "Câu trả lời mạch lạc, bao quát từ tầng rendering đến network. Nêu bật được các phương pháp thực tiễn.",
    },
    {
      id: "q2",
      order: 2,
      category: "Styling & Design System",
      categoryVi: "Giao diện & Design System",
      difficulty: "easy",
      question:
        "Describe your experience with Tailwind CSS and how you build scalable design systems.",
      questionVi:
        "Hãy chia sẻ kinh nghiệm của bạn với Tailwind CSS và cách bạn xây dựng một Design System có thể mở rộng.",
      keyTopics: [
        "Design Tokens",
        "Tailwind Config",
        "CVA (Class Variance Authority)",
        "Reusable Primitives",
      ],
      idealPoints: [
        "Structure color palettes and typography via CSS variables / Tailwind tokens.",
        "Use Class Variance Authority (CVA) or clsx/tailwind-merge for variant-based UI components.",
        "Ensure consistent spacing, accessible contrast ratios, and dark mode support.",
      ],
      idealPointsVi: [
        "Thiết lập biến màu sắc và typography nhất quán qua CSS variables và token.",
        "Kết hợp CVA (Class Variance Authority) hoặc tailwind-merge để tạo các biến thể nút, thẻ dễ tái sử dụng.",
        "Đảm bảo khả năng hỗ trợ dark mode và độ tương phản chuẩn Accessibility (WCAG).",
      ],
      sampleAnswer:
        "I've used Tailwind in multiple production projects. I leverage CSS variables for design tokens and wrap primitives with CVA for clean component APIs.",
      sampleAnswerVi:
        "Tôi xây dựng design tokens bằng CSS variables, kết hợp Tailwind và CVA để tạo ra các component primitives dễ tái sử dụng, đồng bộ giao diện toàn dự án.",
      status: "answered",
      score: 88,
      feedbackVi:
        "Trình bày rõ ràng về quy chuẩn quản lý token và kiến trúc component tái sử dụng.",
    },
    {
      id: "q3",
      order: 3,
      category: "Architecture & State",
      categoryVi: "Kiến trúc & Quản lý Trạng thái",
      difficulty: "hard",
      question:
        "Can you explain how you structure components and state to keep your codebase clean and maintainable?",
      questionVi:
        "Bạn tổ chức cấu trúc component và state như thế nào để mã nguồn luôn gọn gàng, dễ bảo trì khi dự án phát triển lớn?",
      keyTopics: [
        "Feature-based architecture",
        "Server vs Client State",
        "TanStack Query",
        "Zustand",
      ],
      idealPoints: [
        "Separate server state (TanStack Query/SWR) from client UI state (Zustand/Context).",
        "Adopt feature-driven folder structures (FSD or modular feature folders).",
        "Keep presentation components dumb and isolate business logic in custom hooks.",
      ],
      idealPointsVi: [
        "Tách biệt rõ ràng Server State (qua TanStack Query) và Client UI State (qua Zustand).",
        "Tổ chức thư mục theo hướng module tính năng (Feature-based architecture).",
        "Tách biệt logic xử lý dữ liệu sang custom hooks, giữ component UI thuần tuý.",
      ],
      status: "current",
    },
    {
      id: "q4",
      order: 4,
      category: "API & Error Handling",
      categoryVi: "Xử lý API & Ngoại lệ",
      difficulty: "medium",
      question:
        "How do you handle API errors, loading skeletons, and optimistic updates on the frontend?",
      questionVi:
        "Bạn xử lý lỗi API, giao diện tải (skeletons) và cập nhật lạc quan (optimistic updates) như thế nào trên giao diện?",
      keyTopics: ["Error Boundaries", "Optimistic Mutations", "Toast Feedback", "Retry Mechanisms"],
      idealPoints: [
        "Use React Error Boundaries to catch uncaught render errors gracefully.",
        "Apply optimistic UI updates with TanStack Query onMutate for instant feedback.",
        "Provide informative toast messages and fallbacks for failed network calls.",
      ],
      idealPointsVi: [
        "Sử dụng React Error Boundaries để bắt lỗi render cục bộ mà không làm sập toàn bộ trang.",
        "Triển khai Optimistic Updates để cập nhật giao diện ngay lập tức trước khi server phản hồi.",
        "Hiển thị thông báo toast thân thiện và có cơ chế thử lại (retry).",
      ],
      status: "pending",
    },
    {
      id: "q5",
      order: 5,
      category: "Behavioral & Problem Solving",
      categoryVi: "Tình huống & Tư duy Giải quyết Vấn đề",
      difficulty: "medium",
      question:
        "Tell me about a challenging technical bug you encountered in production and how you diagnosed and resolved it.",
      questionVi:
        "Hãy kể về một lỗi kỹ thuật khó khăn trên môi trường Production mà bạn từng gặp phải và cách bạn đã chẩn đoán, khắc phục nó.",
      keyTopics: [
        "Debugging methodology",
        "Root cause analysis",
        "Monitoring / Logs",
        "Prevention",
      ],
      idealPoints: [
        "Demonstrate systematic debugging using DevTools, logs, and APM tools.",
        "Explain root cause analysis and the exact fix implemented.",
        "Discuss preventive measures like automated tests or lint rules added.",
      ],
      idealPointsVi: [
        "Thể hiện phương pháp điều tra có hệ thống qua log, Chrome DevTools và monitoring.",
        "Giải thích nguyên nhân gốc rễ (Root Cause) và giải pháp khắc phục triệt để.",
        "Nêu các biện pháp phòng ngừa (viết unit test, thêm monitoring) để không tái diễn.",
      ],
      status: "pending",
    },
  ],
};

const defaultFrontendQuestions = MOCK_QUESTIONS_BY_ROLE["frontend-developer"] || [];

export const DEFAULT_MOCK_REPORT: InterviewEvaluationReport = {
  sessionId: "upnext-ai-session-8823",
  roleTitle: "Senior Frontend Developer",
  roleTitleVi: "Lập trình viên Frontend (React/Next.js)",
  level: "senior",
  interviewType: "technical",
  completedAt: "2026-09-02T19:40:00Z",
  durationSeconds: 1140, // 19 mins
  overallScore: 86,
  verdict: "STRONG_HIRE",
  verdictTitleVi: "Đạt Tiêu Chuẩn Xuất Sắc (Strong Hire)",
  verdictSummaryVi:
    "Ứng viên thể hiện kiến thức nền tảng vững chắc về hệ sinh thái React/Next.js, tư duy tối ưu hiệu năng sắc bén và phong thái tự tin, mạch lạc.",
  competencies: [
    { name: "Technical Depth", nameVi: "Chuyên môn Kỹ thuật", score: 90, fullMark: 100 },
    { name: "Problem Solving", nameVi: "Giải quyết Vấn đề", score: 85, fullMark: 100 },
    { name: "Communication", nameVi: "Kỹ năng Giao tiếp", score: 88, fullMark: 100 },
    { name: "System Thinking", nameVi: "Tư duy Hệ thống", score: 82, fullMark: 100 },
    { name: "Confidence & Fit", nameVi: "Thái độ & Sự Tự tin", score: 85, fullMark: 100 },
    { name: "Best Practices", nameVi: "Quy chuẩn Mã nguồn", score: 88, fullMark: 100 },
  ],
  workmapMetrics: [
    {
      label: "Presentation & Delivery",
      labelVi: "Trình bày & Diễn đạt",
      percentage: 90,
      color: "#0aa56f",
    },
    {
      label: "Technical Precision",
      labelVi: "Độ chính xác Chuyên môn",
      percentage: 88,
      color: "#10b981",
    },
    {
      label: "Architectural Vision",
      labelVi: "Tầm nhìn Kiến trúc",
      percentage: 82,
      color: "#8b5cf6",
    },
    {
      label: "Practical Experience",
      labelVi: "Kinh nghiệm Thực chiến",
      percentage: 85,
      color: "#06b6d4",
    },
  ],
  strengthsVi: [
    "Nắm rất vững các cơ chế tối ưu Core Web Vitals, SSR/SSG và Dynamic Imports của Next.js.",
    "Khả năng phân chia cấu trúc State (Server State vs Client State) rất bài bản và thực tế.",
    "Cách diễn đạt tự tin, cấu trúc câu trả lời rõ ràng (STAR method), đi thẳng vào trọng tâm.",
    "Ý thức cao về trải nghiệm người dùng (UX) và khả năng mở rộng của Design System.",
  ],
  strengths: [
    "Deep understanding of Core Web Vitals optimization and Next.js rendering architectures.",
    "Clean separation between Server State (TanStack Query) and Client State (Zustand).",
    "Confident communication with structured, concise answers.",
    "Strong emphasis on design system scalability and accessibility.",
  ],
  improvementsVi: [
    "Nên đào sâu thêm về kỹ thuật tối ưu hóa bộ nhớ khi xử lý các danh sách dữ liệu siêu lớn (Virtualization).",
    "Có thể bổ sung thêm ví dụ thực tế về việc thiết lập CI/CD kiểm thử tự động cho frontend.",
  ],
  improvements: [
    "Could elaborate more on list virtualization when dealing with huge datasets.",
    "Provide more details on automated CI/CD frontend test pipelines.",
  ],
  questions: defaultFrontendQuestions,
  aiSummaryNotes:
    "Candidate demonstrated senior-level frontend acumen with structured technical explanations, performance awareness, and strong architectural instincts.",
  aiSummaryNotesVi:
    "Ứng viên thể hiện rõ năng lực Senior Frontend với tư duy giải pháp thực tế, nắm chắc kỹ thuật tối ưu hóa và có khả năng làm chủ dự án quy mô lớn.",
};
