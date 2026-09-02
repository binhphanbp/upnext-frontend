import { Question, InterviewRole, ExperienceLevel, Language } from "../types";

export const QUESTION_BANK: Record<Language, Question[]> = {
  vi: [
    // --- FRONTEND ---
    {
      id: "fe-01",
      role: "frontend",
      level: "junior",
      category: "intro",
      text: "Bạn hãy giới thiệu đôi nét về bản thân và kinh nghiệm phát triển Frontend gần đây của bạn?",
      expectedKeyPoints: [
        "Kinh nghiệm làm việc",
        "Công nghệ chính (React, TypeScript, CSS)",
        "Dự án tiêu biểu",
        "Định hướng phát triển",
      ],
      sampleGoodAnswer:
        "Em là lập trình viên Frontend có kinh nghiệm làm việc với React, TypeScript và Tailwind CSS. Trong dự án gần nhất, em đã xây dựng dashboard quản lý với khả năng tối ưu render và tích hợp RESTful API...",
      timeLimitSeconds: 90,
    },
    {
      id: "fe-02",
      role: "frontend",
      level: "middle",
      category: "technical",
      text: "Bạn hãy giải thích cơ chế Virtual DOM trong React và cách tối ưu hóa re-render trong một ứng dụng lớn?",
      expectedKeyPoints: [
        "Virtual DOM",
        "Diffing Algorithm",
        "useMemo",
        "useCallback",
        "React.memo",
        "State colocation",
        "Code splitting",
      ],
      sampleGoodAnswer:
        "Virtual DOM là bản sao nhẹ dạng JavaScript object của DOM thật. Khi state thay đổi, React tạo VDOM mới và so sánh với VDOM cũ bằng thuật toán Diffing (Reconciliation). Để tối ưu re-render, ta sử dụng React.memo, useCallback, useMemo và tách nhỏ component để cô lập state...",
      timeLimitSeconds: 120,
    },
    {
      id: "fe-03",
      role: "frontend",
      level: "senior",
      category: "technical",
      text: "Làm thế nào để bạn đo lường và tối ưu các chỉ số Core Web Vitals (LCP, FID/INP, CLS) cho một trang web thương mại điện tử có lượng truy cập cao?",
      expectedKeyPoints: [
        "Core Web Vitals",
        "LCP tối ưu ảnh / CDN",
        "INP/FID giảm JavaScript execution",
        "CLS giữ kích thước cố định layout",
        "SSR / SSG",
        "Lazy loading",
      ],
      sampleGoodAnswer:
        "Để tối ưu LCP, ta ưu tiên load hero image với fetchpriority=high, dùng CDN và nén WebP/AVIF. Với INP, chia nhỏ Long Tasks bằng Web Workers hoặc yield to main thread. Để tránh CLS, luôn khai báo width/height cho hình ảnh và khung quảng cáo...",
      timeLimitSeconds: 120,
    },

    // --- BACKEND ---
    {
      id: "be-01",
      role: "backend",
      level: "junior",
      category: "intro",
      text: "Hãy giới thiệu về bản thân và ngăn xếp công nghệ (tech stack) backend mà bạn tự tin nhất?",
      expectedKeyPoints: [
        "Ngôn ngữ (Node.js/Go/Java/Python)",
        "Cơ sở dữ liệu (PostgreSQL/MongoDB)",
        "REST API",
        "Kiến thức nền tảng",
      ],
      sampleGoodAnswer:
        "Chào anh/chị, em là Backend Developer chuyên sâu về Node.js/TypeScript và cơ sở dữ liệu PostgreSQL. Em đã từng thiết kế hệ thống REST API, quản lý xác thực JWT và xử lý lưu trữ cache với Redis...",
      timeLimitSeconds: 90,
    },
    {
      id: "be-02",
      role: "backend",
      level: "middle",
      category: "technical",
      text: "Khi database gặp hiện tượng truy vấn chậm (slow query) khi dữ liệu tăng cao, bạn sẽ tiếp cận điều tra và tối ưu như thế nào?",
      expectedKeyPoints: [
        "EXPLAIN ANALYZE",
        "Database Indexing (B-Tree, Composite)",
        "N+1 query problem",
        "Connection Pooling",
        "Caching Redis",
        "Read Replica / Sharding",
      ],
      sampleGoodAnswer:
        "Bước đầu tiên là bật Slow Query Log và dùng lệnh EXPLAIN ANALYZE để kiểm tra execution plan xem có Sequential Scan không. Sau đó đánh Index thích hợp (B-Tree hoặc Composite index), tối ưu câu lệnh SQL, dùng Caching với Redis và phân tách Read/Write replica nếu tải đọc quá lớn...",
      timeLimitSeconds: 120,
    },
    {
      id: "be-03",
      role: "backend",
      level: "senior",
      category: "technical",
      text: "Bạn hãy so sánh kiến trúc Monolith và Microservices, đồng thời nêu các chiến lược đảm bảo tính nhất quán dữ liệu (Data Consistency) trong Microservices?",
      expectedKeyPoints: [
        "Saga Pattern (Choreography/Orchestration)",
        "Event-Driven Architecture",
        "Two-Phase Commit",
        "Outbox Pattern",
        "Idempotency",
        "CAP Theorem",
      ],
      sampleGoodAnswer:
        "Monolith phù hợp cho giai đoạn đầu với tốc độ phát triển nhanh và ACID tự nhiên. Với Microservices, để đảm bảo eventual consistency, ta áp dụng Saga Pattern (Choreography hoặc Orchestrator), Transactional Outbox Pattern kết hợp Message Broker như Kafka/RabbitMQ để tránh phân tán dữ liệu lỗi...",
      timeLimitSeconds: 120,
    },

    // --- FULLSTACK ---
    {
      id: "fs-01",
      role: "fullstack",
      level: "middle",
      category: "technical",
      text: "Bạn hãy trình bày quy trình bảo mật một ứng dụng web từ Frontend đến Backend (Authentication, XSS, CSRF, SQL Injection)?",
      expectedKeyPoints: [
        "HttpOnly Cookies vs JWT",
        "Sanitization XSS",
        "CORS & CSRF Tokens",
        "Prepared Statements / ORM",
        "Rate Limiting",
        "Content Security Policy (CSP)",
      ],
      sampleGoodAnswer:
        "Về Authentication, lưu trữ JWT trong HttpOnly SameSite Cookie để chống XSS đánh cắp token. Ở Backend dùng Prepared Statements/Parameterized Queries chống SQL Injection, bật CORS nghiêm ngặt, áp dụng Helmet CSP và Rate Limiting chống Brute-force/DDoS...",
      timeLimitSeconds: 120,
    },
    {
      id: "fs-02",
      role: "fullstack",
      level: "senior",
      category: "situational",
      text: "Nếu hệ thống web đột ngột sập trong đợt siêu sale lớn, bạn sẽ điều tra nguyên nhân gốc rễ và xử lý như thế nào?",
      expectedKeyPoints: [
        "Monitoring APM (Datadog/Prometheus)",
        "Kiểm tra CPU/RAM/DB Connections",
        "Failover / Auto-scaling",
        "Circuit Breaker",
        "Post-mortem Report",
      ],
      sampleGoodAnswer:
        "Đầu tiên kiểm tra APM và log tập trung để xác định điểm nghẽn (DB connection pool cạn kiệt hay CPU spike). Tạm thời bật Rate Limit / Queue chờ cho user, kích hoạt Auto-scaling hoặc cache cứng các trang tĩnh. Sau khi phục hồi, tổ chức Post-mortem để tìm root-cause và vá lỗ hổng...",
      timeLimitSeconds: 120,
    },

    // --- PRODUCT MANAGER ---
    {
      id: "pm-01",
      role: "product_manager",
      level: "middle",
      category: "situational",
      text: "Khi có quá nhiều tính năng được yêu cầu từ ban giám đốc, khách hàng và đội Sales nhưng nguồn lực dev có hạn, bạn sẽ ưu tiên (Prioritize) như thế nào?",
      expectedKeyPoints: [
        "Khung ưu tiên (RICE, MoSCoW, ICE)",
        "Business Impact vs Engineering Effort",
        "Dữ liệu người dùng & Analytics",
        "Truyền thông với các bên liên quan (Stakeholders)",
      ],
      sampleGoodAnswer:
        "Tôi sử dụng mô hình RICE (Reach, Impact, Confidence, Effort) để định lượng giá trị của từng tính năng. Sau đó phân loại theo MoSCoW và đối chiếu với mục tiêu chiến lược OKRs của quý. Cuối cùng, tôi tổ chức họp minh bạch hóa dữ liệu với các bên liên quan...",
      timeLimitSeconds: 120,
    },

    // --- DATA ANALYST ---
    {
      id: "da-01",
      role: "data_analyst",
      level: "middle",
      category: "technical",
      text: "Bạn hãy chia sẻ quy trình thực hiện một dự án phân tích dữ liệu từ dữ liệu thô đến việc tạo ra báo cáo mang lại giá trị hành động (Actionable Insights)?",
      expectedKeyPoints: [
        "Thu thập & Data Cleaning",
        "EDA (Exploratory Data Analysis)",
        "SQL / Python / Pandas",
        "Visualization (Tableau/PowerBI)",
        "Actionable Insights cho Business",
      ],
      sampleGoodAnswer:
        "Quy trình gồm 5 bước: Xác định bài toán kinh doanh, Trích xuất và làm sạch dữ liệu thô (xử lý null/outliers), Phân tích khám phá (EDA), Trực quan hóa dữ liệu qua Dashboard trực quan và đề xuất các hành động cụ thể giúp cải thiện tỷ lệ chuyển đổi hoặc giảm chi phí...",
      timeLimitSeconds: 120,
    },

    // --- HR & BEHAVIORAL (STAR) ---
    {
      id: "hr-01",
      role: "hr_behavioral",
      level: "junior",
      category: "behavioral",
      text: "Hãy kể lại một tình huống bạn gặp phải bất đồng ý kiến với đồng nghiệp trong công việc và cách bạn đã giải quyết nó (theo mô hình STAR)?",
      expectedKeyPoints: [
        "Tình huống (Situation)",
        "Nhiệm vụ (Task)",
        "Hành động (Action - lắng nghe, đối thoại, dựa trên dữ liệu)",
        "Kết quả (Result - giải pháp tối ưu, quan hệ tốt đẹp)",
      ],
      sampleGoodAnswer:
        "Trong dự án trước, em và một bạn dev có bất đồng về việc lựa chọn thư viện UI. Thay vì tranh cãi cá nhân, em đã đề xuất tạo bảng so sánh benchmark cụ thể về bundle size và khả năng mở rộng. Cuối cùng cả nhóm đã thống nhất phương án hiệu quả nhất và dự án về đích đúng hạn...",
      timeLimitSeconds: 120,
    },
    {
      id: "hr-02",
      role: "hr_behavioral",
      level: "middle",
      category: "behavioral",
      text: "Bạn hãy chia sẻ về một thất bại hoặc sai lầm lớn nhất bạn từng mắc phải trong công việc và bài học bạn rút ra được từ đó?",
      expectedKeyPoints: [
        "Thừa nhận sai lầm thẳng thắn",
        "Hành động khắc phục sự cố ngay lập tức",
        "Bài học kinh nghiệm & Quy trình phòng ngừa trong tương lai",
      ],
      sampleGoodAnswer:
        "Tôi từng vô tình triển khai một cấu hình sai lên môi trường production khiến một số người dùng không thể đăng nhập trong 15 phút. Tôi đã ngay lập tức rollback, thông báo sự cố minh bạch và thiết lập thêm bước kiểm tra tự động CI/CD để lỗi này không bao giờ tái diễn...",
      timeLimitSeconds: 120,
    },

    // --- ENGLISH COMM ---
    {
      id: "en-01",
      role: "english_comm",
      level: "junior",
      category: "intro",
      text: "Hãy giới thiệu ngắn gọn về bản thân, thế mạnh lớn nhất và lý do bạn muốn ứng tuyển vào vị trí này?",
      expectedKeyPoints: [
        "Giới thiệu kinh nghiệm",
        "Điểm mạnh nổi bật",
        "Đam mê nghề nghiệp",
        "Sự phù hợp với công ty",
      ],
      sampleGoodAnswer:
        "Tôi là người có tinh thần học hỏi cao, khả năng giải quyết vấn đề linh hoạt và làm việc nhóm hiệu quả. Tôi mong muốn được cống hiến vào các sản phẩm quy mô lớn của công ty...",
      timeLimitSeconds: 90,
    },
  ],

  en: [
    // --- FRONTEND ---
    {
      id: "en-fe-01",
      role: "frontend",
      level: "junior",
      category: "intro",
      text: "Please introduce yourself and highlight your recent experience in frontend web development.",
      expectedKeyPoints: [
        "Background & Education",
        "Core stack (React, TypeScript, CSS)",
        "Key projects built",
        "Growth mindset",
      ],
      sampleGoodAnswer:
        "I am a Frontend Developer with strong expertise in React, TypeScript, and modern styling libraries like Tailwind CSS. In my recent project, I built an interactive dashboard focusing on performance optimization...",
      timeLimitSeconds: 90,
    },
    {
      id: "en-fe-02",
      role: "frontend",
      level: "middle",
      category: "technical",
      text: "Can you explain how the React Virtual DOM works and what strategies you use to prevent unnecessary re-renders in large applications?",
      expectedKeyPoints: [
        "Virtual DOM & Reconciliation diffing",
        "React.memo",
        "useMemo and useCallback",
        "State colocation",
        "Component breakdown",
      ],
      sampleGoodAnswer:
        "React maintains a lightweight JavaScript object representation of the real DOM. When state changes, it generates a new Virtual DOM tree and performs reconciliation using its diffing algorithm. To prevent unnecessary re-renders, we use React.memo, useCallback, useMemo, and colocate state...",
      timeLimitSeconds: 120,
    },
    {
      id: "en-fe-03",
      role: "frontend",
      level: "senior",
      category: "technical",
      text: "How do you measure and optimize Core Web Vitals (LCP, INP, CLS) for high-traffic web applications?",
      expectedKeyPoints: [
        "LCP image optimization & CDN",
        "INP breaking long tasks",
        "CLS layout stability & aspect ratios",
        "Code splitting",
        "SSR/SSG",
      ],
      sampleGoodAnswer:
        "To optimize LCP, we prioritize critical resources using fetchpriority=high, leverage modern formats like WebP/AVIF, and utilize CDNs. For INP, we break up long JavaScript tasks. For CLS, we always define width and height attributes for images and dynamic embeds...",
      timeLimitSeconds: 120,
    },

    // --- BACKEND ---
    {
      id: "en-be-01",
      role: "backend",
      level: "middle",
      category: "technical",
      text: "When a database experiences slow query performance under heavy load, how do you diagnose and optimize it?",
      expectedKeyPoints: [
        "EXPLAIN ANALYZE",
        "Indexing strategy (B-Tree/Composite)",
        "N+1 query resolution",
        "Connection pooling",
        "Redis caching",
        "Read replicas",
      ],
      sampleGoodAnswer:
        "I start by inspecting slow query logs and running EXPLAIN ANALYZE to analyze execution plans. Next, I ensure appropriate indexing, eliminate N+1 queries, introduce Redis caching for read-heavy endpoints, and scale with read replicas if necessary...",
      timeLimitSeconds: 120,
    },
    {
      id: "en-be-02",
      role: "backend",
      level: "senior",
      category: "technical",
      text: "What are the main patterns to achieve data consistency across distributed microservices without distributed locking?",
      expectedKeyPoints: [
        "Saga Pattern (Orchestration vs Choreography)",
        "Transactional Outbox Pattern",
        "Event-Driven Architecture",
        "Idempotent Consumers",
        "Eventual Consistency",
      ],
      sampleGoodAnswer:
        "Instead of two-phase commits, we rely on eventual consistency via the Saga Pattern (either choreographed or orchestrated). We combine this with the Transactional Outbox pattern to reliably publish events to brokers like Kafka, ensuring all consumers are idempotent...",
      timeLimitSeconds: 120,
    },

    // --- HR & BEHAVIORAL ---
    {
      id: "en-hr-01",
      role: "hr_behavioral",
      level: "junior",
      category: "behavioral",
      text: "Describe a challenging situation where you had a disagreement with a team member. How did you handle it using the STAR method?",
      expectedKeyPoints: [
        "Situation",
        "Task",
        "Action (open communication, data-driven reasoning)",
        "Result (positive outcome, mutual respect)",
      ],
      sampleGoodAnswer:
        "In my previous project, a colleague and I had differing opinions on architectural design. I scheduled a constructive 1-on-1 session where we created a comparative benchmark matrix based on performance and maintainability. We aligned on the best objective approach and completed the milestone ahead of time...",
      timeLimitSeconds: 120,
    },
    {
      id: "en-hr-02",
      role: "hr_behavioral",
      level: "middle",
      category: "behavioral",
      text: "Tell me about a time you made a critical mistake in production and how you resolved it.",
      expectedKeyPoints: [
        "Taking full ownership",
        "Rapid triage and mitigation/rollback",
        "Transparent stakeholder communication",
        "Post-mortem and prevention mechanisms",
      ],
      sampleGoodAnswer:
        "I once deployed a configuration change that triggered intermittent authentication timeouts. I took immediate ownership, performed a rollback within 5 minutes, communicated status updates transparently, and instituted automated pre-deployment smoke tests to prevent recurrence...",
      timeLimitSeconds: 120,
    },

    // --- ENGLISH COMM ---
    {
      id: "en-comm-01",
      role: "english_comm",
      level: "junior",
      category: "intro",
      text: "Tell me about yourself, your core strengths, and what motivates you to excel in this role.",
      expectedKeyPoints: [
        "Clear self-introduction",
        "Key professional strengths",
        "Passion for solving complex problems",
        "Value alignment with the team",
      ],
      sampleGoodAnswer:
        "I am a passionate software engineer driven by building scalable, user-centric products. My core strengths are quick problem solving, proactive collaboration, and continuous learning. I am excited about this role because it allows me to contribute directly to impactful challenges...",
      timeLimitSeconds: 90,
    },
  ],
};

export function getQuestionsForSession(
  role: InterviewRole,
  level: ExperienceLevel,
  language: Language,
  count: number = 3,
): Question[] {
  const bank = QUESTION_BANK[language] || QUESTION_BANK["vi"];

  // Filter by matching role first
  let matching = bank.filter((q) => q.role === role);

  // If not enough questions for role, include general behavioral / intro questions
  if (matching.length < count) {
    const general = bank.filter((q) => q.role === "hr_behavioral" || q.role === "english_comm");
    matching = [...matching, ...general];
  }

  // Deduplicate and slice count
  const unique = Array.from(new Set(matching));
  return unique.slice(0, count);
}
