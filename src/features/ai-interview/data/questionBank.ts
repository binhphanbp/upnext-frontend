import { Question, InterviewRole, ExperienceLevel, Language } from "../types";

export const QUESTION_BANK: Record<Language, Question[]> = {
  vi: [
    // ==========================================
    // --- FRONTEND DEVELOPER ---
    // ==========================================

    // [FRONTEND - INTERN] (Cơ bản, thân thiện, kiến thức trường học & nền tảng Web)
    {
      id: "fe-intern-01",
      role: "frontend",
      level: "intern",
      category: "intro",
      text: "Bạn hãy giới thiệu đôi nét về bản thân, ngành học và đồ án hoặc bài tập lớn về Frontend đầu tiên mà bạn từng tự làm?",
      expectedKeyPoints: [
        "Giới thiệu trường / ngành học",
        "Kiến thức HTML/CSS/JavaScript cơ bản",
        "Đồ án môn học hoặc project tự học",
        "Mong muốn học hỏi trong kỳ thực tập",
      ],
      sampleGoodAnswer:
        "Em chào anh/chị, em là sinh viên năm cuối chuyên ngành CNTT. Em đã tự học và làm đồ án môn học xây dựng một trang web bán hàng cơ bản bằng HTML, CSS, JavaScript và React. Trong kỳ thực tập này, em mong muốn được cọ xát thực tế, học hỏi quy trình làm việc nhóm và nâng cao kỹ năng code của mình...",
      timeLimitSeconds: 90,
    },
    {
      id: "fe-intern-02",
      role: "frontend",
      level: "intern",
      category: "technical",
      text: "Trong JavaScript, bạn hiểu như thế nào về sự khác biệt giữa let, const và var? Khi nào bạn sẽ ưu tiên dùng const?",
      expectedKeyPoints: [
        "Block scope (let/const) vs Function scope (var)",
        "Hoisting",
        "const không cho phép gán lại (re-assign)",
        "Ưu tiên dùng const cho biến không đổi để code an toàn",
      ],
      sampleGoodAnswer:
        "Dạ, var có phạm vi function scope và bị hoisting, dễ gây lỗi ngoài ý muốn. Còn let và const có block scope trong cặp ngoặc nhọn. Điểm khác là const không thể gán lại giá trị sau khi khai báo. Em luôn ưu tiên dùng const cho tất cả các biến, chỉ dùng let khi biến đó thực sự cần thay đổi giá trị như vòng lặp...",
      timeLimitSeconds: 90,
    },
    {
      id: "fe-intern-03",
      role: "frontend",
      level: "intern",
      category: "technical",
      text: "Khi bắt đầu làm quen với React, bạn hiểu Component và State là gì? Bạn đã từng dùng useState để làm tính năng gì cơ bản?",
      expectedKeyPoints: [
        "Component là khối giao diện tái sử dụng",
        "State là dữ liệu nội bộ có thể thay đổi và kích hoạt giao diện cập nhật",
        "useState hook",
        "Ví dụ: nút tăng giảm số lượng, bật tắt popup hoặc nhập form",
      ],
      sampleGoodAnswer:
        "Component trong React giống như các mảnh ghép Lego giúp chia nhỏ giao diện để dễ quản lý và tái sử dụng. Còn State là dữ liệu riêng của component, khi state thay đổi thì React sẽ tự vẽ lại giao diện. Em đã dùng useState để làm chức năng đếm số lượng giỏ hàng và bật tắt menu trên thanh navbar...",
      timeLimitSeconds: 90,
    },

    // [FRONTEND - FRESHER] (Có đồ án hoàn chỉnh, hiểu React cơ bản, Props & API)
    {
      id: "fe-fresher-01",
      role: "frontend",
      level: "fresher",
      category: "intro",
      text: "Hãy giới thiệu về bản thân và ngăn xếp công nghệ (React, Tailwind CSS, TypeScript...) mà bạn đã sử dụng trong dự án tốt nghiệp hoặc đồ án gần nhất?",
      expectedKeyPoints: [
        "Kinh nghiệm làm đồ án thực tế",
        "Stack công nghệ (React, TypeScript, CSS)",
        "Cách tổ chức code và Git",
        "Định hướng phát triển",
      ],
      sampleGoodAnswer:
        "Em là Fresher Frontend Developer thành thạo React, TypeScript và Tailwind CSS. Trong đồ án tốt nghiệp, em đã xây dựng một web app đặt vé xem phim có tích hợp REST API, quản lý routing với React Router và lưu trữ mã nguồn trên GitHub...",
      timeLimitSeconds: 90,
    },
    {
      id: "fe-fresher-02",
      role: "frontend",
      level: "fresher",
      category: "technical",
      text: "Bạn hãy phân biệt sự khác nhau giữa Props và State trong React? Làm thế nào để truyền dữ liệu từ Component con lên Component cha?",
      expectedKeyPoints: [
        "Props là dữ liệu truyền từ cha xuống (read-only)",
        "State là trạng thái nội bộ của component",
        "Truyền callback function từ cha xuống con để con gọi và gửi dữ liệu lên",
      ],
      sampleGoodAnswer:
        "Props là tham số truyền từ component cha xuống và mang tính bất biến (read-only), còn State là dữ liệu do chính component đó quản lý và có thể thay đổi. Để truyền dữ liệu từ con lên cha, ta truyền một hàm callback từ cha xuống qua props, khi con có sự kiện sẽ gọi hàm đó và truyền dữ liệu kèm theo...",
      timeLimitSeconds: 90,
    },
    {
      id: "fe-fresher-03",
      role: "frontend",
      level: "fresher",
      category: "technical",
      text: "Bạn thường gọi API và xử lý bất đồng bộ (Async/Await) trong React như thế nào (ví dụ với useEffect, trạng thái loading và error)?",
      expectedKeyPoints: [
        "useEffect hook với dependency array",
        "async/await hoặc fetch/axios",
        "Xử lý 3 trạng thái: Loading, Success, Error",
        "Hiển thị skeleton/spinner",
      ],
      sampleGoodAnswer:
        "Em thường dùng useEffect với dependency array rỗng để gọi API một lần khi mount. Trong hàm async, em đặt state isLoading = true, dùng khối try-catch để lấy dữ liệu qua axios/fetch, nếu thành công thì lưu vào state data, nếu lỗi thì bắt catch và hiển thị thông báo lỗi cho người dùng...",
      timeLimitSeconds: 90,
    },

    // [FRONTEND - JUNIOR] (1-2 năm kinh nghiệm, tự chủ tính năng, Custom Hooks)
    {
      id: "fe-junior-01",
      role: "frontend",
      level: "junior",
      category: "intro",
      text: "Bạn hãy giới thiệu về kinh nghiệm làm việc thực tế của mình và một tính năng phức tạp mà bạn từng tự tay xây dựng gần đây?",
      expectedKeyPoints: [
        "1-2 năm kinh nghiệm thực tế",
        "Dự án thương mại / sản phẩm",
        "Tính năng phức tạp (Form validation, Table pagination, Real-time)",
        "Giải quyết vấn đề",
      ],
      sampleGoodAnswer:
        "Em đã có hơn 1 năm làm việc với React, Next.js và TypeScript. Gần đây em chịu trách nhiệm xây dựng tính năng Dynamic Form Builder cho phép người dùng tự kéo thả các trường thông tin, tích hợp React Hook Form và Zod schema để validate dữ liệu chặt chẽ...",
      timeLimitSeconds: 90,
    },
    {
      id: "fe-junior-02",
      role: "frontend",
      level: "junior",
      category: "technical",
      text: "Bạn hiểu như thế nào về vòng đời useEffect trong React? Khi nào ta cần viết hàm Cleanup trong useEffect?",
      expectedKeyPoints: [
        "Mount, Update (theo dependency array), Unmount",
        "Cleanup function chạy khi unmount hoặc trước effect tiếp theo",
        "Ví dụ: hủy event listener, clearTimeout/clearInterval, cancel fetch request (AbortController)",
      ],
      sampleGoodAnswer:
        "useEffect thực thi logic phụ sau khi DOM đã render. Hàm cleanup return bên trong useEffect sẽ chạy khi component unmount hoặc trước khi effect kế tiếp chạy lại. Cleanup cực kỳ quan trọng để tránh memory leak, ví dụ như gỡ addEventListener window, hủy setInterval hoặc hủy AbortController khi người dùng chuyển trang...",
      timeLimitSeconds: 120,
    },
    {
      id: "fe-junior-03",
      role: "frontend",
      level: "junior",
      category: "technical",
      text: "Bạn đã từng tạo Custom Hook nào chưa? Khi nào chúng ta nên trừu tượng hóa logic thành một Custom Hook?",
      expectedKeyPoints: [
        "Tái sử dụng logic stateful giữa nhiều component",
        'Đặt tên bắt đầu bằng "use"',
        "Ví dụ: useDebounce, useLocalStorage, useWindowSize, useFetch",
      ],
      sampleGoodAnswer:
        "Ta nên tạo Custom Hook khi có logic xử lý state hoặc side effect lặp lại ở nhiều nơi. Em đã từng viết hook useDebounce để giảm số lần gọi API tìm kiếm khi người dùng gõ phím, và hook useLocalStorage để tự động đồng bộ state với LocalStorage của trình duyệt...",
      timeLimitSeconds: 120,
    },

    // [FRONTEND - MIDDLE] (3-4 năm kinh nghiệm, tối ưu hiệu năng, kiến trúc State)
    {
      id: "fe-middle-01",
      role: "frontend",
      level: "middle",
      category: "technical",
      text: "Bạn hãy giải thích cơ chế Virtual DOM trong React và các kỹ thuật tối ưu hóa re-render trong một ứng dụng lớn (React.memo, useMemo, useCallback, State Colocation)?",
      expectedKeyPoints: [
        "Virtual DOM & Diffing Algorithm (Reconciliation)",
        "React.memo, useMemo, useCallback",
        "State Colocation & Component Splitting",
        "Code Splitting (React.lazy, dynamic import)",
      ],
      sampleGoodAnswer:
        "Virtual DOM là cây object biểu diễn UI trong bộ nhớ. Khi state đổi, React chạy Diffing algorithm để tính toán patch nhỏ nhất vào real DOM. Để tối ưu re-render, ta dùng React.memo cho pure component, useMemo cho phép tính nặng, useCallback để giữ nguyên tham chiếu hàm, và quan trọng nhất là đưa state xuống component thấp nhất có thể (State Colocation)...",
      timeLimitSeconds: 120,
    },
    {
      id: "fe-middle-02",
      role: "frontend",
      level: "middle",
      category: "technical",
      text: "Khi nào bạn chọn Context API và khi nào bạn sử dụng thư viện quản lý State tập trung như Zustand hoặc Redux Toolkit?",
      expectedKeyPoints: [
        "Context API phù hợp cho dữ liệu ít thay đổi (Theme, Auth, Language)",
        "Vấn đề re-render toàn bộ consumer của Context",
        "Zustand / Redux Toolkit với selector subscription tối ưu cho dữ liệu phức tạp",
      ],
      sampleGoodAnswer:
        "Context API phù hợp với global state có tần suất cập nhật thấp như Theme, thông tin User đã login, đa ngôn ngữ. Tuy nhiên Context dễ gây re-render không cần thiết cho toàn bộ consumer. Với state phức tạp, cập nhật liên tục như E-commerce Cart hay Table Dashboard, em ưu tiên dùng Zustand vì nhẹ, dùng selector subscription chính xác và không cần Provider bọc ngoài...",
      timeLimitSeconds: 120,
    },

    // [FRONTEND - SENIOR] (5+ năm kinh nghiệm, Core Web Vitals, Security, Kiến trúc lớn)
    {
      id: "fe-senior-01",
      role: "frontend",
      level: "senior",
      category: "technical",
      text: "Làm thế nào để bạn đo lường và tối ưu các chỉ số Core Web Vitals (LCP, INP, CLS) cho một hệ thống Web thương mại điện tử có hàng triệu lượt truy cập?",
      expectedKeyPoints: [
        "LCP tối ưu ảnh CDN / SSR / Preload",
        "INP tối ưu Long Tasks & Web Workers",
        "CLS giữ kích thước layout ổn định",
        "RUM (Real User Monitoring) Datadog/Sentry",
      ],
      sampleGoodAnswer:
        "Để tối ưu LCP, ta áp dụng SSR/SSG, preload Hero image với fetchpriority=high, tối ưu CDN và nén WebP/AVIF. Với INP, ta chia nhỏ Long Tasks, tránh blocking main thread và chuyển tác vụ nặng sang Web Worker. Để loại bỏ CLS, luôn khai báo explicit aspect-ratio cho ảnh và khung quảng cáo...",
      timeLimitSeconds: 120,
    },

    // ==========================================
    // --- BACKEND DEVELOPER ---
    // ==========================================

    // [BACKEND - INTERN]
    {
      id: "be-intern-01",
      role: "backend",
      level: "intern",
      category: "intro",
      text: "Bạn hãy giới thiệu về bản thân, ngôn ngữ lập trình Backend bạn đã học (Node.js/Python/Java) và đồ án quản lý dữ liệu bạn từng thực hiện?",
      expectedKeyPoints: [
        "Giới thiệu ngành học",
        "Ngôn ngữ backend & Database cơ bản (SQL/MongoDB)",
        "Đồ án CRUD cơ bản",
        "Tinh thần học hỏi",
      ],
      sampleGoodAnswer:
        "Em chào anh/chị, em là sinh viên năm cuối chuyên ngành Công nghệ phần mềm. Em đã học và thực hành Node.js Express cùng cơ sở dữ liệu MySQL. Em đã xây dựng một website quản lý thư viện sinh viên hỗ trợ các thao tác thêm, sửa, xóa, tìm kiếm sách cơ bản...",
      timeLimitSeconds: 90,
    },
    {
      id: "be-intern-02",
      role: "backend",
      level: "intern",
      category: "technical",
      text: "Bạn hiểu RESTful API là gì? Các HTTP Method phổ biến (GET, POST, PUT, DELETE) có ý nghĩa như thế nào?",
      expectedKeyPoints: [
        "Kiến trúc REST client-server qua HTTP",
        "GET lấy dữ liệu",
        "POST tạo mới",
        "PUT cập nhật toàn bộ",
        "DELETE xóa dữ liệu",
        "Status codes 200, 201, 400, 404, 500",
      ],
      sampleGoodAnswer:
        "RESTful API là chuẩn giao tiếp giữa client và server thông qua giao thức HTTP. GET dùng để đọc dữ liệu, POST dùng để tạo mới bản ghi, PUT dùng để cập nhật dữ liệu đã có, và DELETE dùng để xóa bản ghi. Server trả về mã HTTP status như 200 thành công, 404 không tìm thấy hoặc 500 lỗi máy chủ...",
      timeLimitSeconds: 90,
    },
    {
      id: "be-intern-03",
      role: "backend",
      level: "intern",
      category: "technical",
      text: "Trong cơ sở dữ liệu quan hệ (SQL), bạn hiểu Khóa chính (Primary Key) và Khóa ngoại (Foreign Key) dùng để làm gì?",
      expectedKeyPoints: [
        "Primary Key định danh duy nhất cho mỗi dòng",
        "Foreign Key liên kết dữ liệu giữa hai bảng",
        "Ràng buộc toàn vẹn dữ liệu (Referential Integrity)",
      ],
      sampleGoodAnswer:
        "Khóa chính là cột có giá trị duy nhất và không được null để nhận diện chính xác từng bản ghi trong bảng. Còn khóa ngoại là cột liên kết tới khóa chính của một bảng khác, giúp thiết lập mối quan hệ giữa các bảng và đảm bảo tính toàn vẹn dữ liệu...",
      timeLimitSeconds: 90,
    },

    // [BACKEND - JUNIOR]
    {
      id: "be-junior-01",
      role: "backend",
      level: "junior",
      category: "intro",
      text: "Hãy giới thiệu về kinh nghiệm làm việc backend của bạn và cách bạn thiết kế, phân quyền API (JWT, Middleware) trong dự án gần nhất?",
      expectedKeyPoints: [
        "1-2 năm kinh nghiệm Backend",
        "Node.js/Python/Java stack",
        "JWT Authentication & Role-based Authorization Middleware",
      ],
      sampleGoodAnswer:
        "Em có hơn 1 năm kinh nghiệm phát triển REST API với Node.js và PostgreSQL. Trong dự án gần nhất, em xây dựng hệ thống xác thực người dùng bằng JWT access token và refresh token, sử dụng middleware để kiểm tra quyền truy cập theo vai trò (Admin, User)...",
      timeLimitSeconds: 90,
    },
    {
      id: "be-junior-02",
      role: "backend",
      level: "junior",
      category: "technical",
      text: "Database Index là gì? Khi nào nên đánh Index và việc lạm dụng quá nhiều Index sẽ gây tác hại gì?",
      expectedKeyPoints: [
        "Cấu trúc B-Tree giúp tăng tốc truy vấn tìm kiếm",
        "Đánh index trên cột hay WHERE, JOIN, ORDER BY",
        "Tác hại: tốn dung lượng và làm chậm thao tác ghi (INSERT, UPDATE, DELETE)",
      ],
      sampleGoodAnswer:
        "Index giống như mục lục sách, giúp Database tìm bản ghi nhanh hơn mà không cần quét toàn bộ bảng (Full Table Scan). Ta nên đánh index trên các trường thường xuyên tìm kiếm, JOIN hay sắp xếp. Tuy nhiên nếu đánh quá nhiều index sẽ làm chậm thao tác INSERT, UPDATE vì mỗi lần ghi đều phải cập nhật lại cây index...",
      timeLimitSeconds: 120,
    },

    // [BACKEND - SENIOR]
    {
      id: "be-senior-01",
      role: "backend",
      level: "senior",
      category: "technical",
      text: "Bạn hãy so sánh kiến trúc Monolith và Microservices, đồng thời nêu các chiến lược đảm bảo tính nhất quán dữ liệu (Saga Pattern, Outbox Pattern) trong hệ thống phân tán?",
      expectedKeyPoints: [
        "Monolith vs Microservices",
        "Saga Pattern (Orchestration/Choreography)",
        "Transactional Outbox Pattern",
        "Event-Driven với Kafka/RabbitMQ",
        "Idempotency",
      ],
      sampleGoodAnswer:
        "Monolith đơn giản và dễ duy trì tính ACID trong giai đoạn đầu. Khi hệ thống lớn, Microservices tách biệt domain nhưng đối mặt với thách thức phân tán dữ liệu. Để đảm bảo Eventual Consistency, ta áp dụng Saga Pattern cùng Transactional Outbox Pattern với Message Broker như Kafka, đảm bảo mọi consumer đều có tính Idempotent...",
      timeLimitSeconds: 120,
    },

    // ==========================================
    // --- FULLSTACK DEVELOPER ---
    // ==========================================
    {
      id: "fs-intern-01",
      role: "fullstack",
      level: "intern",
      category: "intro",
      text: "Bạn hãy giới thiệu về bản thân và một ứng dụng web từ giao diện đến máy chủ (Frontend + Backend) mà bạn từng xây dựng?",
      expectedKeyPoints: [
        "Giới thiệu trường học / kỹ năng",
        "Frontend (React/HTML/CSS) + Backend (Node/Python/PHP)",
        "Database cơ bản",
        "Đam mê học hỏi",
      ],
      sampleGoodAnswer:
        "Em là sinh viên định hướng Fullstack. Em đã tự tay làm một dự án website Blog cá nhân có giao diện React, kết nối Backend Node.js Express và lưu trữ bài viết trong cơ sở dữ liệu MongoDB...",
      timeLimitSeconds: 90,
    },
    {
      id: "fs-junior-01",
      role: "fullstack",
      level: "junior",
      category: "technical",
      text: "Bạn hãy trình bày quy trình bảo mật cơ bản cho một ứng dụng web (chống XSS, CSRF, SQL Injection và cấu hình CORS)?",
      expectedKeyPoints: [
        "Lưu JWT an toàn",
        "Sanitize input chống XSS",
        "Prepared Statements chống SQL Injection",
        "CORS whitelist origin",
      ],
      sampleGoodAnswer:
        "Ở Frontend, ta cần sanitize input người dùng để chống XSS và lưu token trong HttpOnly Cookie. Ở Backend, ta dùng Parameterized Queries để chống SQL Injection, cấu hình CORS chỉ cho phép domain tin cậy và áp dụng Rate Limiting để ngăn chặn spam...",
      timeLimitSeconds: 120,
    },

    // ==========================================
    // --- HR & BEHAVIORAL ---
    // ==========================================
    {
      id: "hr-intern-01",
      role: "hr_behavioral",
      level: "intern",
      category: "behavioral",
      text: "Khi gặp một lỗi (bug) khó trong đồ án hoặc bài tập mà bạn chưa từng thấy trước đây, bạn thường làm các bước nào để tìm cách giải quyết?",
      expectedKeyPoints: [
        "Đọc kỹ thông báo lỗi và log",
        "Tìm kiếm trên Google, StackOverflow, tài liệu chính thức",
        "Thử nghiệm cô lập lỗi",
        "Chủ động hỏi đồng đội hoặc mentor khi đã tìm hiểu kỹ",
      ],
      sampleGoodAnswer:
        "Đầu tiên em đọc kỹ thông báo lỗi và vị trí dòng code gây lỗi trong console. Sau đó em tra cứu từ khóa lỗi trên StackOverflow và tài liệu chính thức của thư viện. Nếu sau 30 phút vẫn chưa tìm ra nguyên nhân, em sẽ tổng hợp lại những gì đã thử và nhờ anh/chị mentor hỗ trợ...",
      timeLimitSeconds: 90,
    },
    {
      id: "hr-junior-01",
      role: "hr_behavioral",
      level: "junior",
      category: "behavioral",
      text: "Bạn hãy kể về một lần bạn và đồng nghiệp có ý kiến bất đồng trong công việc. Bạn đã trao đổi và giải quyết tình huống đó như thế nào theo mô hình STAR?",
      expectedKeyPoints: [
        "Tình huống (Situation)",
        "Nhiệm vụ (Task)",
        "Hành động (Action: lắng nghe, dựa trên dữ liệu/benchmark)",
        "Kết quả (Result: thống nhất giải pháp tốt nhất)",
      ],
      sampleGoodAnswer:
        "Trong một dự án trước, em và đồng đội có quan điểm khác nhau về việc chọn thư viện State Management. Em đã chủ động tạo buổi trao đổi ngắn, lập bảng so sánh ưu nhược điểm dựa trên nhu cầu thực tế của dự án. Cả hai đã thống nhất chọn giải pháp tối ưu nhất và hoàn thành đúng tiến độ...",
      timeLimitSeconds: 120,
    },
  ],

  en: [
    // [FRONTEND - INTERN]
    {
      id: "en-fe-intern-01",
      role: "frontend",
      level: "intern",
      category: "intro",
      text: "Please introduce yourself, your academic background, and the first frontend project you built while studying or learning.",
      expectedKeyPoints: [
        "Academic background",
        "Fundamental HTML/CSS/JavaScript knowledge",
        "First project experience",
        "Eagerness to learn",
      ],
      sampleGoodAnswer:
        "Hello, I am a final-year Computer Science student passionate about Frontend development. I have built personal projects using HTML, CSS, JavaScript and basic React...",
      timeLimitSeconds: 90,
    },
    {
      id: "en-fe-intern-02",
      role: "frontend",
      level: "intern",
      category: "technical",
      text: "In JavaScript, what is the difference between var, let, and const? When do you prefer using const?",
      expectedKeyPoints: [
        "Block scope vs Function scope",
        "Hoisting behavior",
        "Re-assignment rules for const",
        "Immutability best practice",
      ],
      sampleGoodAnswer:
        "var is function-scoped and hoisted, which can lead to bugs. let and const are block-scoped. const variables cannot be reassigned, so I default to const for safety and only use let when a value must change...",
      timeLimitSeconds: 90,
    },
    // [FRONTEND - JUNIOR]
    {
      id: "en-fe-junior-01",
      role: "frontend",
      level: "junior",
      category: "intro",
      text: "Tell me about your practical frontend experience and a feature you recently implemented using React and TypeScript.",
      expectedKeyPoints: [
        "1-2 years experience",
        "React, TypeScript, CSS framework",
        "Feature implementation",
        "Problem solving",
      ],
      sampleGoodAnswer:
        "I have over a year of experience working with React and TypeScript. Recently, I built a dynamic form module with schema validation using Zod and React Hook Form...",
      timeLimitSeconds: 90,
    },
  ],
};

/**
 * Filter questions STRICTLY matching candidate's chosen Level & Role
 */
export function getQuestionsForSession(
  role: InterviewRole,
  level: ExperienceLevel,
  language: Language,
  count: number = 3,
): Question[] {
  const bank = QUESTION_BANK[language] || QUESTION_BANK["vi"];

  // 1. Exact match for both Role and Level
  let matching = bank.filter((q) => q.role === role && q.level === level);

  // 2. If fewer than count, pick from adjacent levels (e.g. intern -> fresher -> junior)
  if (matching.length < count) {
    const levelOrder: ExperienceLevel[] = ["intern", "fresher", "junior", "middle", "senior"];
    const currentIdx = levelOrder.indexOf(level);

    // Check nearest levels
    for (let offset = 1; offset < levelOrder.length && matching.length < count; offset++) {
      const lower = currentIdx - offset >= 0 ? levelOrder[currentIdx - offset] : null;
      const higher =
        currentIdx + offset < levelOrder.length ? levelOrder[currentIdx + offset] : null;

      if (lower) {
        const extra = bank.filter(
          (q) => q.role === role && q.level === lower && !matching.includes(q),
        );
        matching.push(...extra);
      }
      if (higher && matching.length < count) {
        const extra = bank.filter(
          (q) => q.role === role && q.level === higher && !matching.includes(q),
        );
        matching.push(...extra);
      }
    }
  }

  // 3. Fallback to behavioral if still needed
  if (matching.length < count) {
    const general = bank.filter(
      (q) => (q.role === "hr_behavioral" || q.role === "english_comm") && !matching.includes(q),
    );
    matching.push(...general);
  }

  return matching.slice(0, count);
}
