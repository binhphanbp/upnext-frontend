/**
 * Deterministic demo scenarios for the Candidate Copilot.
 *
 * The AI service (`upnext-ai`) does not exist yet — weeks 2–16 of the plan build
 * it. Until `POST /api/v1/ai/conversations/:id/messages` is live, the UI is driven
 * by these fixtures through the same event shape the real SSE endpoint will emit
 * (§13.3), so no component knows it is looking at mock data.
 *
 * Content is intentionally realistic Vietnamese IT-recruitment data: the point of
 * the demo (§29) is that a reviewer can read the answer and judge whether the
 * grounding, scoring and guardrails behave the way the report claims.
 */

import type {
  AiActionRequest,
  AiCard,
  AiCitation,
  AiErrorCode,
  AiIntent,
  AiRunStatus,
  AiToolCall,
} from "../types";

export type MockScenario = {
  intent: AiIntent;
  /** Tool timeline, replayed in order. */
  tools: { tool: AiToolCall; durationMs: number; detail?: string }[];
  /** Streamed token-by-token. `[n]` markers bind to the citation with that index. */
  answer: string;
  citations: AiCitation[];
  cards: AiCard[];
  actionRequest?: AiActionRequest;
  suggestions: string[];
  /** When present the run terminates in this failure instead of `done`. */
  failure?: { code: AiErrorCode; detail: string; status: AiRunStatus };
  /** Emitted before the failure, so `partial` results still render (§15.4). */
  meta: { model: string; promptVersion: string; inputTokens: number; outputTokens: number };
};

const DEFAULT_META = {
  model: "gpt-4o-mini",
  promptVersion: "candidate-copilot@1.4.0",
  inputTokens: 1_820,
  outputTokens: 412,
};

/* -------------------------------------------------------------------------- */
/* Scenario: CV analysis                                                       */
/* -------------------------------------------------------------------------- */

const cvAnalysis: MockScenario = {
  intent: "CV_ANALYSIS",
  tools: [
    {
      tool: { id: "t1", name: "get_own_cv", label: "Đọc CV đang chọn", status: "running" },
      durationMs: 620,
      detail: "CV_v3_BackendDeveloper.pdf",
    },
    {
      tool: {
        id: "t2",
        name: "analyze_own_cv",
        label: "Trích xuất dữ liệu có cấu trúc",
        status: "running",
      },
      durationMs: 1_450,
      detail: "18 kỹ năng · 3 kinh nghiệm · 4 dự án",
    },
  ],
  answer:
    "CV của bạn đạt **78/100**. Điểm mạnh rõ nhất là phần kỹ thuật: bạn liệt kê đủ stack backend và có dự án thật để dẫn chứng [1].\n\nHai vấn đề làm giảm điểm nhiều nhất:\n\n1. **Thành tựu chưa lượng hóa.** Phần mô tả công việc ở UpNext JSC chỉ nêu nhiệm vụ, không nêu kết quả [2]. Nhà tuyển dụng không đo được tác động của bạn.\n2. **Thiếu mục Tóm tắt.** CV vào thẳng phần kinh nghiệm, người đọc mất 15–20 giây đầu để tự đoán bạn định ứng tuyển vị trí gì.\n\nĐiểm ATS 84 là ổn — cấu trúc heading và định dạng file đọc máy tốt.",
  citations: [
    {
      id: "c1",
      index: 1,
      sourceType: "CV",
      sourceId: "cv-v3",
      title: "CV_v3_BackendDeveloper.pdf — Dự án",
      excerpt:
        "Hệ thống đặt lịch khám: NestJS, PostgreSQL, Redis, Docker. Thiết kế schema và API cho 12 endpoint.",
      href: "/candidate/cv-builder",
    },
    {
      id: "c2",
      index: 2,
      sourceType: "CV",
      sourceId: "cv-v3",
      title: "CV_v3_BackendDeveloper.pdf — Kinh nghiệm",
      excerpt:
        "Backend Developer, UpNext JSC (03/2024 – nay): Phát triển API, sửa lỗi, tham gia code review.",
      href: "/candidate/cv-builder",
    },
  ],
  cards: [
    {
      type: "cv_analysis",
      cvVersionId: "cv-v3",
      cvName: "CV_v3_BackendDeveloper.pdf",
      overallScore: 78,
      scores: { completeness: 82, clarity: 75, impact: 68, atsReadiness: 84 },
      strengths: [
        {
          text: "Stack backend nhất quán và có chiều sâu",
          evidence: "NestJS, PostgreSQL, Redis, Docker xuất hiện cả ở kỹ năng lẫn dự án",
        },
        {
          text: "Có dự án cá nhân kèm mô tả kỹ thuật",
          evidence: "Mục Dự án — hệ thống đặt lịch khám, 12 endpoint",
        },
      ],
      weaknesses: [
        {
          text: "Mô tả công việc không có số liệu kết quả",
          evidence: "Kinh nghiệm tại UpNext JSC — 3 gạch đầu dòng, không có chỉ số nào",
        },
        {
          text: "Không nêu quy mô hệ thống từng làm",
          evidence: "Không có thông tin về lượng truy cập, số bản ghi hay số người dùng",
        },
      ],
      missingSections: ["Tóm tắt nghề nghiệp", "Chứng chỉ"],
      href: "/candidate/cv-builder",
    },
  ],
  actionRequest: {
    id: "act-1",
    actionType: "APPLY_CV_SUGGESTION",
    title: "Thêm mục Tóm tắt nghề nghiệp vào CV",
    description:
      "AI đã soạn sẵn đoạn tóm tắt dựa trên kinh nghiệm hiện có trong CV. Nội dung chỉ được ghi vào CV sau khi bạn xác nhận.",
    changes: [
      {
        label: "Tóm tắt nghề nghiệp",
        to: "Backend Developer 2 năm kinh nghiệm với NestJS và PostgreSQL, tập trung vào thiết kế API và tối ưu truy vấn. Đã tham gia xây dựng hệ thống tuyển dụng phục vụ người dùng nội bộ.",
      },
    ],
    confirmLabel: "Thêm vào CV",
    status: "PENDING",
  },
  suggestions: [
    "Viết lại phần kinh nghiệm có số liệu",
    "So sánh CV này với một tin tuyển dụng",
    "Tôi còn thiếu kỹ năng gì cho vị trí Backend?",
  ],
  meta: DEFAULT_META,
};

/* -------------------------------------------------------------------------- */
/* Scenario: job search                                                        */
/* -------------------------------------------------------------------------- */

const jobSearch: MockScenario = {
  intent: "JOB_SEARCH",
  tools: [
    {
      tool: {
        id: "t1",
        name: "get_own_profile",
        label: "Đọc hồ sơ và nguyện vọng",
        status: "running",
      },
      durationMs: 480,
      detail: "Backend Developer · Hà Nội · Hybrid",
    },
    {
      tool: {
        id: "t2",
        name: "search_public_jobs",
        label: "Lọc tin tuyển dụng đang mở",
        status: "running",
      },
      durationMs: 900,
      detail: "148 tin qua hard filter",
    },
    {
      tool: {
        id: "t3",
        name: "rank_matching_jobs",
        label: "Chấm điểm hybrid matching",
        status: "running",
      },
      durationMs: 1_600,
      detail: "hybrid-match-v1.0.0",
    },
  ],
  answer:
    "Mình tìm được **3 vị trí** phù hợp nhất với hồ sơ hiện tại của bạn. Điểm số được tính bằng thuật toán, không phải do mô hình tự ước lượng — bạn bấm vào từng thẻ để xem chi tiết cách chấm.\n\nVị trí dẫn đầu là **Backend Developer tại Kyber Tech (84%)**: yêu cầu NestJS và PostgreSQL trùng khớp trực tiếp với kinh nghiệm của bạn [1]. Điểm trừ duy nhất là họ cần kinh nghiệm với message queue, phần này CV bạn chưa thể hiện.\n\nLưu ý: cả 3 vị trí đều có **độ tin cậy dưới 70%** vì CV chưa ghi số năm kinh nghiệm cho từng kỹ năng. Bổ sung thông tin này sẽ làm điểm chính xác hơn.",
  citations: [
    {
      id: "c1",
      index: 1,
      sourceType: "JOB",
      sourceId: "job-kyber",
      title: "Backend Developer — Kyber Tech",
      excerpt:
        "Yêu cầu: NestJS hoặc Express, PostgreSQL, Docker. Ưu tiên ứng viên từng làm với RabbitMQ hoặc Kafka.",
      href: "/jobs/backend-developer-kyber-tech",
    },
  ],
  cards: [
    {
      type: "job_match",
      jobId: "job-kyber",
      title: "Backend Developer",
      companyName: "Kyber Tech",
      location: "Hà Nội",
      workingModel: "Hybrid",
      salaryLabel: "20 – 30 triệu",
      totalScore: 84,
      confidenceScore: 62,
      confidenceReason: "CV chưa ghi số năm kinh nghiệm cho 3 kỹ năng bắt buộc",
      breakdown: [
        { key: "required", label: "Kỹ năng bắt buộc", score: 87, weight: 0.45 },
        { key: "nice", label: "Kỹ năng ưu tiên", score: 65, weight: 0.1 },
        { key: "experience", label: "Kinh nghiệm liên quan", score: 80, weight: 0.15 },
        { key: "semantic", label: "Tương đồng vai trò", score: 88, weight: 0.15 },
        { key: "workingModel", label: "Hình thức làm việc", score: 100, weight: 0.07 },
        { key: "location", label: "Địa điểm", score: 100, weight: 0.04 },
        { key: "salary", label: "Mức lương", score: 0, weight: 0.04, unknown: true },
      ],
      matchedSkills: ["NestJS", "PostgreSQL", "Docker", "TypeScript"],
      missingSkills: ["Redis", "Message queue"],
      toVerify: ["Kinh nghiệm thiết kế hệ thống tải cao"],
      algorithmVersion: "hybrid-match-v1.0.0",
      href: "/jobs/backend-developer-kyber-tech",
    },
    {
      type: "job_match",
      jobId: "job-vnpay",
      title: "Software Engineer (Backend)",
      companyName: "Minh Long Digital",
      location: "Hà Nội",
      workingModel: "Onsite",
      salaryLabel: "18 – 26 triệu",
      totalScore: 79,
      confidenceScore: 66,
      confidenceReason: "Thiếu thông tin về domain fintech trong hồ sơ",
      breakdown: [
        { key: "required", label: "Kỹ năng bắt buộc", score: 81, weight: 0.45 },
        { key: "nice", label: "Kỹ năng ưu tiên", score: 60, weight: 0.1 },
        { key: "experience", label: "Kinh nghiệm liên quan", score: 74, weight: 0.15 },
        { key: "semantic", label: "Tương đồng vai trò", score: 85, weight: 0.15 },
        { key: "workingModel", label: "Hình thức làm việc", score: 70, weight: 0.07 },
        { key: "location", label: "Địa điểm", score: 100, weight: 0.04 },
        { key: "salary", label: "Mức lương", score: 90, weight: 0.04 },
      ],
      matchedSkills: ["NestJS", "PostgreSQL", "TypeScript"],
      missingSkills: ["Kafka", "Kinh nghiệm fintech"],
      toVerify: ["Mức độ thành thạo tối ưu truy vấn"],
      algorithmVersion: "hybrid-match-v1.0.0",
      href: "/jobs/software-engineer-minh-long",
    },
    {
      type: "job_match",
      jobId: "job-teko",
      title: "Backend Engineer (Node.js)",
      companyName: "Hải Đăng Software",
      location: "Remote",
      workingModel: "Remote",
      salaryLabel: "Thỏa thuận",
      totalScore: 73,
      confidenceScore: 58,
      confidenceReason: "Tin tuyển dụng không công bố mức lương và số năm yêu cầu",
      breakdown: [
        { key: "required", label: "Kỹ năng bắt buộc", score: 76, weight: 0.45 },
        { key: "nice", label: "Kỹ năng ưu tiên", score: 55, weight: 0.1 },
        { key: "experience", label: "Kinh nghiệm liên quan", score: 68, weight: 0.15 },
        { key: "semantic", label: "Tương đồng vai trò", score: 80, weight: 0.15 },
        { key: "workingModel", label: "Hình thức làm việc", score: 85, weight: 0.07 },
        { key: "location", label: "Địa điểm", score: 100, weight: 0.04 },
        { key: "salary", label: "Mức lương", score: 0, weight: 0.04, unknown: true },
      ],
      matchedSkills: ["Node.js", "TypeScript", "PostgreSQL"],
      missingSkills: ["GraphQL", "AWS"],
      toVerify: ["Khả năng làm việc remote toàn thời gian"],
      algorithmVersion: "hybrid-match-v1.0.0",
      href: "/jobs/backend-engineer-hai-dang",
    },
  ],
  suggestions: [
    "So sánh tôi với vị trí Kyber Tech",
    "Tôi cần bổ sung gì để tăng độ tin cậy?",
    "Lọc thêm các vị trí remote",
  ],
  meta: { ...DEFAULT_META, outputTokens: 640 },
};

/* -------------------------------------------------------------------------- */
/* Scenario: skill gap                                                         */
/* -------------------------------------------------------------------------- */

const skillGap: MockScenario = {
  intent: "SKILL_GAP",
  tools: [
    {
      tool: {
        id: "t1",
        name: "compare_own_cv_to_job",
        label: "Đối chiếu CV với yêu cầu",
        status: "running",
      },
      durationMs: 1_200,
      detail: "9 kỹ năng bắt buộc · 5 kỹ năng ưu tiên",
    },
  ],
  answer:
    "So với **Backend Developer tại Kyber Tech**, bạn đang thiếu 2 kỹ năng bắt buộc và 1 kỹ năng ưu tiên.\n\nKhoảng cách lớn nhất là **message queue** — đây là kỹ năng bắt buộc và CV bạn không có bất kỳ dẫn chứng nào [1]. Redis thì bạn có nhắc trong phần kỹ năng nhưng không có dự án nào chứng minh, nên hệ thống xếp vào nhóm *chưa được chứng minh* chứ không phải *thiếu*.\n\nĐiều này **không làm giảm điểm phù hợp** của bạn — nó làm giảm độ tin cậy. Nếu bạn thực sự đã dùng Redis, chỉ cần bổ sung một dòng dẫn chứng vào CV là điểm sẽ thay đổi.",
  citations: [
    {
      id: "c1",
      index: 1,
      sourceType: "JOB",
      sourceId: "job-kyber",
      title: "Backend Developer — Kyber Tech · Yêu cầu bắt buộc",
      excerpt:
        "Kinh nghiệm làm việc với hệ thống hàng đợi (RabbitMQ, Kafka hoặc tương đương) tối thiểu 1 năm.",
      href: "/jobs/backend-developer-kyber-tech",
    },
  ],
  cards: [
    {
      type: "skill_gap",
      jobTitle: "Backend Developer — Kyber Tech",
      gaps: [
        {
          skill: "Message queue (RabbitMQ / Kafka)",
          importance: "required",
          status: "missing",
          note: "Không xuất hiện ở bất kỳ mục nào trong CV",
        },
        {
          skill: "Redis",
          importance: "required",
          status: "unproven",
          note: "Có trong danh sách kỹ năng nhưng không có dự án hoặc kinh nghiệm dẫn chứng",
        },
        {
          skill: "Kubernetes",
          importance: "nice_to_have",
          status: "missing",
          note: "Kỹ năng ưu tiên, không bắt buộc để ứng tuyển",
        },
        {
          skill: "Thiết kế hệ thống tải cao",
          importance: "nice_to_have",
          status: "partial",
          note: "Có kinh nghiệm tối ưu truy vấn nhưng chưa nêu quy mô hệ thống",
        },
      ],
      preparationQuestions: [
        "Khi nào bạn chọn message queue thay vì gọi API trực tiếp?",
        "Bạn đã dùng Redis cho cache hay cho session? Kể một trường hợp cụ thể.",
        "Mô tả một truy vấn bạn từng tối ưu và cách bạn đo kết quả.",
      ],
    },
  ],
  suggestions: [
    "Gợi ý lộ trình học message queue",
    "Luyện phỏng vấn cho vị trí này",
    "Tìm việc không yêu cầu message queue",
  ],
  meta: { ...DEFAULT_META, outputTokens: 388 },
};

/* -------------------------------------------------------------------------- */
/* Scenario: application status                                                */
/* -------------------------------------------------------------------------- */

const applicationStatus: MockScenario = {
  intent: "APPLICATION_STATUS",
  tools: [
    {
      tool: {
        id: "t1",
        name: "get_own_applications",
        label: "Đọc đơn ứng tuyển của bạn",
        status: "running",
      },
      durationMs: 540,
      detail: "4 đơn đang hoạt động",
    },
  ],
  answer:
    "Bạn có **4 đơn đang hoạt động**. Đơn cần chú ý nhất là **Kyber Tech** — nhà tuyển dụng đã chuyển sang trạng thái *Phỏng vấn* từ 3 ngày trước [1] nhưng chưa có lịch cụ thể.\n\nHai đơn ở Minh Long Digital và Hải Đăng Software vẫn ở trạng thái *Đang xem xét*, thời gian phản hồi trung bình của hai công ty này là 7–10 ngày.",
  citations: [
    {
      id: "c1",
      index: 1,
      sourceType: "APPLICATION",
      sourceId: "app-1",
      title: "Đơn ứng tuyển — Backend Developer, Kyber Tech",
      excerpt: "Trạng thái đổi từ SCREENING sang INTERVIEW lúc 14:20 ngày 27/07/2026.",
      href: "/candidate/applications/app-1",
    },
  ],
  cards: [
    {
      type: "application_status",
      applicationId: "app-1",
      jobTitle: "Backend Developer",
      companyName: "Kyber Tech",
      status: "Phỏng vấn",
      statusTone: "info",
      appliedAt: "18/07/2026",
      timeline: [
        { label: "Đã nộp", at: "18/07", state: "done" },
        { label: "Sàng lọc", at: "22/07", state: "done" },
        { label: "Phỏng vấn", at: "27/07", state: "current" },
        { label: "Kết quả", at: "—", state: "upcoming" },
      ],
      href: "/candidate/applications/app-1",
    },
  ],
  suggestions: [
    "Chuẩn bị phỏng vấn cho Kyber Tech",
    "Soạn email hỏi lịch phỏng vấn",
    "Xem tất cả đơn ứng tuyển",
  ],
  meta: { ...DEFAULT_META, outputTokens: 240 },
};

/* -------------------------------------------------------------------------- */
/* Scenario: mock interview                                                    */
/* -------------------------------------------------------------------------- */

const mockInterview: MockScenario = {
  intent: "MOCK_INTERVIEW",
  tools: [
    {
      tool: {
        id: "t1",
        name: "start_own_mock_interview",
        label: "Tạo đề cương phỏng vấn",
        status: "running",
      },
      durationMs: 1_350,
      detail: "7 câu · độ khó trung bình",
    },
  ],
  answer:
    "Mình đã tạo bộ phỏng vấn thử **7 câu, độ khó trung bình**, bám theo yêu cầu của vị trí Backend Developer tại Kyber Tech.\n\nCâu hỏi sẽ thích ứng theo câu trả lời của bạn: trả lời tốt thì đi sâu hơn, trả lời chưa rõ thì hỏi lại cùng chủ đề ở mức dễ hơn. Mỗi câu chấm theo 5 tiêu chí và có đáp án gợi ý sau khi bạn trả lời.\n\nDưới đây là kết quả câu đầu tiên để bạn hình dung cách chấm điểm.",
  citations: [],
  cards: [
    {
      type: "interview_feedback",
      questionIndex: 1,
      questionTotal: 7,
      question: "Bạn xử lý N+1 query trong TypeORM hoặc Prisma như thế nào?",
      score: 76,
      dimensions: {
        technicalCorrectness: 30,
        relevance: 17,
        depth: 10,
        clarity: 12,
        practicalEvidence: 7,
      },
      strengths: [
        "Nhận diện đúng nguyên nhân N+1 và nêu được giải pháp eager loading",
        "Có nhắc tới việc đo bằng query log",
      ],
      missingPoints: [
        "Chưa nói về DataLoader hoặc batching khi số quan hệ lớn",
        "Chưa nêu trade-off giữa join và nhiều truy vấn nhỏ",
      ],
      href: "/candidate/mock-interviews",
    },
  ],
  actionRequest: {
    id: "act-2",
    actionType: "START_MOCK_INTERVIEW",
    title: "Bắt đầu phiên phỏng vấn thử",
    description:
      "Phiên gồm 7 câu, dự kiến 25–35 phút. Bạn có thể tạm dừng và tiếp tục sau. Kết quả được lưu vào lịch sử phỏng vấn của bạn.",
    changes: [
      { label: "Vị trí", to: "Backend Developer — Kyber Tech" },
      { label: "Số câu hỏi", to: "7 câu" },
      { label: "Độ khó", to: "Trung bình" },
    ],
    confirmLabel: "Bắt đầu phiên",
    status: "PENDING",
  },
  suggestions: [
    "Đổi sang 10 câu khó hơn",
    "Chỉ luyện câu hỏi về database",
    "Xem lịch sử phỏng vấn",
  ],
  meta: { ...DEFAULT_META, outputTokens: 310 },
};

/* -------------------------------------------------------------------------- */
/* Scenario: guardrail (§29 Demo 3)                                            */
/* -------------------------------------------------------------------------- */

const guardrail: MockScenario = {
  intent: "OUT_OF_SCOPE",
  tools: [
    {
      tool: {
        id: "t1",
        name: "search_visible_candidates",
        label: "Kiểm tra quyền công cụ",
        status: "running",
      },
      durationMs: 300,
      detail: "Công cụ thuộc nhóm recruiter",
    },
  ],
  answer:
    "Mình không thực hiện được yêu cầu này.\n\nCông cụ tra cứu danh sách ứng viên chỉ được cấp cho tài khoản nhà tuyển dụng. Tài khoản của bạn đang ở vai trò **ứng viên**, nên công cụ đó không có trong danh sách được đăng ký cho phiên này — kể cả khi câu hỏi yêu cầu bỏ qua chỉ dẫn trước đó.\n\nLần thử này đã được ghi vào nhật ký kiểm soát. Mình vẫn hỗ trợ bạn bình thường với hồ sơ và đơn ứng tuyển của chính bạn.",
  citations: [],
  cards: [],
  suggestions: ["Phân tích CV của tôi", "Tìm việc phù hợp", "Xem trạng thái ứng tuyển"],
  failure: {
    code: "AI_TOOL_NOT_ALLOWED",
    detail: "search_visible_candidates không nằm trong scope của vai trò CANDIDATE",
    status: "permission_denied",
  },
  meta: { ...DEFAULT_META, outputTokens: 180 },
};

/* -------------------------------------------------------------------------- */
/* Scenario: general + out of scope                                            */
/* -------------------------------------------------------------------------- */

const general: MockScenario = {
  intent: "GENERAL_GUIDANCE",
  tools: [
    {
      tool: { id: "t1", name: "get_own_profile", label: "Đọc hồ sơ của bạn", status: "running" },
      durationMs: 460,
      detail: "Backend Developer · 2 năm kinh nghiệm",
    },
  ],
  answer:
    "Mình là trợ lý tuyển dụng của UpNext. Mình làm việc trực tiếp trên dữ liệu thật trong tài khoản của bạn — CV, hồ sơ, đơn ứng tuyển — chứ không trả lời chung chung.\n\nNhững việc mình làm tốt nhất:\n\n- **Phân tích CV**: chấm điểm theo 4 tiêu chí và chỉ ra chỗ cần sửa, kèm trích dẫn từ chính CV của bạn.\n- **Tìm việc phù hợp**: chấm điểm bằng thuật toán có thể kiểm chứng, không phải ước lượng của mô hình.\n- **Chỉ ra khoảng cách năng lực**: kỹ năng nào thiếu, kỹ năng nào có nhưng chưa chứng minh được.\n- **Luyện phỏng vấn**: câu hỏi thích ứng theo câu trả lời, chấm theo rubric 5 tiêu chí.\n\nMình không tự sửa hồ sơ của bạn. Mọi thay đổi đều phải bạn bấm xác nhận.",
  citations: [],
  cards: [],
  suggestions: ["Phân tích CV của tôi", "Tìm việc phù hợp", "Tôi còn thiếu kỹ năng gì?"],
  meta: { ...DEFAULT_META, inputTokens: 640, outputTokens: 260 },
};

const outOfScope: MockScenario = {
  intent: "OUT_OF_SCOPE",
  tools: [],
  answer:
    "Câu hỏi này nằm ngoài phạm vi mình hỗ trợ. Mình chỉ làm việc với dữ liệu tuyển dụng trong tài khoản UpNext của bạn: CV, hồ sơ năng lực, tin tuyển dụng và đơn ứng tuyển.\n\nBạn thử một trong các việc dưới đây nhé.",
  citations: [],
  cards: [],
  suggestions: ["Phân tích CV của tôi", "Tìm việc phù hợp", "Chuẩn bị phỏng vấn"],
  meta: { ...DEFAULT_META, inputTokens: 420, outputTokens: 96 },
};

/* -------------------------------------------------------------------------- */
/* Failure scenarios — used by the state preview and by retry demos            */
/* -------------------------------------------------------------------------- */

const rateLimited: MockScenario = {
  intent: "GENERAL_GUIDANCE",
  tools: [],
  answer: "",
  citations: [],
  cards: [],
  suggestions: [],
  failure: {
    code: "AI_MODEL_RATE_LIMIT",
    detail: "Bạn đã dùng hết 20 lượt hỏi trong giờ này. Hạn mức sẽ được đặt lại sau 24 phút.",
    status: "rate_limited",
  },
  meta: { ...DEFAULT_META, outputTokens: 0 },
};

const modelUnavailable: MockScenario = {
  intent: "GENERAL_GUIDANCE",
  tools: [],
  answer: "",
  citations: [],
  cards: [],
  suggestions: [],
  failure: {
    code: "AI_SERVICE_UNAVAILABLE",
    detail:
      "Không kết nối được tới dịch vụ AI. Các chức năng khác của UpNext vẫn hoạt động bình thường.",
    status: "model_unavailable",
  },
  meta: { ...DEFAULT_META, outputTokens: 0 },
};

const partialResult: MockScenario = {
  intent: "JOB_SEARCH",
  tools: [
    {
      tool: {
        id: "t1",
        name: "get_own_profile",
        label: "Đọc hồ sơ và nguyện vọng",
        status: "running",
      },
      durationMs: 480,
      detail: "Backend Developer · Hà Nội",
    },
    {
      tool: {
        id: "t2",
        name: "rank_matching_jobs",
        label: "Chấm điểm hybrid matching",
        status: "running",
      },
      durationMs: 1_100,
      detail: "Hết thời gian sau 20 giây",
    },
  ],
  answer:
    "Mình mới chấm xong nhóm việc làm đầu tiên thì hết thời gian xử lý. Đây là kết quả một phần — thứ hạng có thể thay đổi khi chạy lại đầy đủ.",
  citations: [],
  cards: [jobSearch.cards[0]!],
  suggestions: ["Chạy lại đầy đủ", "Thu hẹp theo địa điểm Hà Nội"],
  failure: {
    code: "AI_MODEL_TIMEOUT",
    detail: "Vượt quá 20 giây cho một yêu cầu tương tác. Kết quả hiển thị là một phần.",
    status: "partial",
  },
  meta: { ...DEFAULT_META, outputTokens: 120 },
};

/* -------------------------------------------------------------------------- */
/* Routing                                                                     */
/* -------------------------------------------------------------------------- */

export const MOCK_SCENARIOS = {
  cv_analysis: cvAnalysis,
  job_search: jobSearch,
  skill_gap: skillGap,
  application_status: applicationStatus,
  mock_interview: mockInterview,
  guardrail,
  general,
  out_of_scope: outOfScope,
  rate_limited: rateLimited,
  model_unavailable: modelUnavailable,
  partial: partialResult,
} satisfies Record<string, MockScenario>;

export type MockScenarioKey = keyof typeof MOCK_SCENARIOS;

const MATCHERS: { key: MockScenarioKey; patterns: RegExp[] }[] = [
  {
    // Injection / privilege-escalation attempts are checked first so that a
    // request phrased as "phân tích CV rồi cho tôi xem tất cả ứng viên" still
    // lands on the guardrail path.
    key: "guardrail",
    patterns: [
      /bỏ qua (mọi |tất cả )?(chỉ dẫn|hướng dẫn|lệnh)/i,
      /ignore (all )?previous/i,
      /system prompt/i,
      /tất cả (ứng viên|candidate|email)/i,
      /công cụ admin|admin tool|quyền admin/i,
      /danh sách ứng viên khác/i,
    ],
  },
  {
    key: "cv_analysis",
    patterns: [/phân tích cv/i, /cv của tôi/i, /đánh giá cv/i, /cải thiện cv/i],
  },
  {
    key: "skill_gap",
    patterns: [
      /thiếu kỹ năng/i,
      /khoảng cách/i,
      /cần bổ sung/i,
      /so sánh (tôi|cv).*(với|job|vị trí)/i,
    ],
  },
  { key: "application_status", patterns: [/trạng thái|ứng tuyển|đơn của tôi|application/i] },
  { key: "mock_interview", patterns: [/phỏng vấn|interview|luyện tập/i] },
  { key: "job_search", patterns: [/tìm việc|việc phù hợp|gợi ý việc|công việc nào/i] },
  { key: "general", patterns: [/bạn là ai|bạn làm được gì|giúp gì|hướng dẫn/i] },
];

/** Deterministic routing so demos and screenshots reproduce exactly. */
export function resolveScenario(prompt: string): MockScenario {
  for (const matcher of MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(prompt))) {
      return MOCK_SCENARIOS[matcher.key];
    }
  }
  return MOCK_SCENARIOS.out_of_scope;
}
