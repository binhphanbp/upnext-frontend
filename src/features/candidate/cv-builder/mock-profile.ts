import { CvData } from "./types";

export const mockProfileDataVi: CvData = {
  personalInfo: {
    fullName: "Phạm Minh Hoàng",
    title: "Senior Frontend Engineer (React/Next.js)",
    email: "hoang.pham@email.com",
    phoneNumber: "0901 234 567",
    address: "Quận 3, TP. Hồ Chí Minh",
    website: "github.com/hoangpham-dev",
  },
  summary:
    "<p>Lập trình viên Frontend với hơn 5 năm kinh nghiệm phát triển các sản phẩm web quy mô lớn bằng <strong>ReactJS</strong>, <strong>Next.js</strong> và <strong>TypeScript</strong>. Đam mê tối ưu hóa hiệu năng ứng dụng web, cải thiện trải nghiệm người dùng (UX) và xây dựng hệ thống Design System dễ mở rộng. Có kinh nghiệm dẫn dắt đội ngũ kỹ sư nhỏ (3-5 thành viên) và phối hợp nhịp nhàng với bộ phận Product Owner.</p>",
  experiences: [
    {
      id: "exp-1",
      companyName: "Công ty Cổ phần Công nghệ UpNext",
      positionTitle: "Senior Frontend Engineer",
      startDate: "2024-01",
      endDate: "Present",
      isCurrent: true,
      description:
        "<ul><li>Chịu trách nhiệm kiến trúc và phát triển phần giao diện nền tảng tuyển dụng IT sử dụng <strong>Next.js 15 App Router</strong>, Tailwind CSS v4 và TypeScript.</li><li>Tối ưu hóa thời gian tải trang (LCP giảm 35%, FCP giảm 40%) bằng cách tối ưu hóa code-splitting, lazy loading components và caching dữ liệu bằng <strong>TanStack Query</strong>.</li><li>Xây dựng thư viện component tái sử dụng dựa trên Radix UI, giúp giảm 30% thời gian phát triển giao diện của đội ngũ.</li></ul>",
      technologies: "Next.js, React, Tailwind CSS, TypeScript, TanStack Query, Vitest",
    },
    {
      id: "exp-2",
      companyName: "VNG Corporation",
      positionTitle: "Software Engineer - Frontend",
      startDate: "2021-06",
      endDate: "2023-12",
      isCurrent: false,
      description:
        "<ul><li>Phát triển các tính năng tương tác người dùng cao cho sản phẩm giải trí lớn trực thuộc VNG.</li><li>Tích hợp và xây dựng các hệ thống quản lý state phức tạp sử dụng <strong>Zustand</strong> và Redux Toolkit.</li><li>Phối hợp cùng đội ngũ QA viết bộ test tự động UI bằng Cypress và kiểm thử đơn vị với Jest, đạt tỉ lệ bao phủ code 80%.</li></ul>",
      technologies: "ReactJS, Redux, Zustand, JavaScript, Webpack, SASS, Cypress, Jest",
    },
  ],
  educations: [
    {
      id: "edu-1",
      schoolName: "Đại học Bách Khoa TP.HCM",
      degree: "Kỹ sư",
      major: "Khoa học Máy tính",
      startDate: "2017-09",
      endDate: "2021-05",
      isCurrent: false,
      gpa: "3.4/4.0",
      description:
        "<p>Tốt nghiệp loại Giỏi. Nhận học bổng khuyến khích học tập 3 kỳ liên tiếp. Thành viên câu lạc bộ Học thuật Tin học.</p>",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Hệ thống Kanban Board tương tác kéo thả",
      role: "Fullstack Developer (Cá nhân)",
      description:
        "<p>Ứng dụng quản lý dự án lấy cảm hứng từ Trello. Hỗ trợ tạo bảng, cột công việc, kéo thả thẻ công việc cực kỳ mượt mà, cộng tác thời gian thực thông qua Socket.io và xác thực JWT bảo mật.</p>",
      projectUrl: "github.com/hoangpham-dev/trello-clone",
      deployUrl: "trello-clone.hoangpham.dev",
      technologies: "React, Node.js, Express, MongoDB, Socket.io, Tailwind CSS",
    },
    {
      id: "proj-2",
      name: "Trình soạn thảo văn bản thông minh (Notion Clone)",
      role: "Frontend Developer (Cá nhân)",
      description:
        "<p>Trình soạn thảo khối (block editor) hỗ trợ markdown, tải ảnh trực tiếp, lưu trữ ngoại tuyến qua IndexedDB và đồng bộ hóa đám mây. Tối ưu hiệu năng hiển thị hàng ngàn block mà không giật lag.</p>",
      projectUrl: "github.com/hoangpham-dev/notion-clone",
      deployUrl: "editor.hoangpham.dev",
      technologies: "Next.js, TipTap Editor, Tailwind CSS, TypeScript, Zustand",
    },
  ],
  skills: [
    { id: "sk-1", name: "React / Next.js", level: "EXPERT" },
    { id: "sk-2", name: "TypeScript", level: "EXPERT" },
    { id: "sk-3", name: "HTML5 / CSS3 / TailwindCSS", level: "EXPERT" },
    { id: "sk-4", name: "Zustand / Redux / State Management", level: "ADVANCED" },
    { id: "sk-5", name: "Node.js / Express", level: "INTERMEDIATE" },
    { id: "sk-6", name: "RESTful API / GraphQL", level: "ADVANCED" },
    { id: "sk-7", name: "Git / CI-CD (GitHub Actions)", level: "ADVANCED" },
  ],
  sectionsOrder: ["personal", "summary", "experience", "projects", "education", "skills"],
  style: {
    fontFamily: "font-sans",
    themeColor: "teal",
    textSize: "base",
    marginSize: "base",
  },
  selectedTemplate: "modern",
  cvLanguage: "vi",
};

export const mockProfileDataEn: CvData = {
  personalInfo: {
    fullName: "Minh Hoang Pham",
    title: "Senior Frontend Engineer (React/Next.js)",
    email: "hoang.pham@email.com",
    phoneNumber: "+84 901 234 567",
    address: "District 3, Ho Chi Minh City, Vietnam",
    website: "github.com/hoangpham-dev",
  },
  summary:
    "<p>Frontend Engineer with over 5 years of experience developing large-scale web applications using <strong>ReactJS</strong>, <strong>Next.js</strong>, and <strong>TypeScript</strong>. Passionate about web performance optimization, user experience (UX) enhancements, and building scalable Design Systems. Experienced in leading small engineering teams (3-5 members) and collaborating closely with Product Owners.</p>",
  experiences: [
    {
      id: "exp-1",
      companyName: "UpNext Technology Corporation",
      positionTitle: "Senior Frontend Engineer",
      startDate: "2024-01",
      endDate: "Present",
      isCurrent: true,
      description:
        "<ul><li>Responsible for architecture and development of the IT Recruitment Platform frontend using <strong>Next.js 15 App Router</strong>, Tailwind CSS v4, and TypeScript.</li><li>Optimized page loading performance (LCP reduced by 35%, FCP by 40%) through code-splitting, lazy-loading components, and server-state caching with <strong>TanStack Query</strong>.</li><li>Built a reusable UI library based on Radix UI primitives, reducing frontend development time by 30% across the team.</li></ul>",
      technologies: "Next.js, React, Tailwind CSS, TypeScript, TanStack Query, Vitest",
    },
    {
      id: "exp-2",
      companyName: "VNG Corporation",
      positionTitle: "Software Engineer - Frontend",
      startDate: "2021-06",
      endDate: "2023-12",
      isCurrent: false,
      description:
        "<ul><li>Developed highly interactive user-facing features for a flagship entertainment product at VNG.</li><li>Integrated and managed complex application state using <strong>Zustand</strong> and Redux Toolkit.</li><li>Collaborated with QA to write automated UI tests using Cypress and unit tests with Jest, achieving 80% code coverage.</li></ul>",
      technologies: "ReactJS, Redux, Zustand, JavaScript, Webpack, SASS, Cypress, Jest",
    },
  ],
  educations: [
    {
      id: "edu-1",
      schoolName: "Ho Chi Minh City University of Technology (HCMUT)",
      degree: "Bachelor of Engineering",
      major: "Computer Science",
      startDate: "2017-09",
      endDate: "2021-05",
      isCurrent: false,
      gpa: "3.4/4.0",
      description:
        "<p>Graduated with Honors. Awarded academic achievement scholarships for 3 consecutive semesters. Member of the Computer Science Academic Club.</p>",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Interactive Drag & Drop Kanban Board",
      role: "Fullstack Developer (Personal Project)",
      description:
        "<p>Project management application inspired by Trello. Features smooth drag-and-drop column and card movement, real-time collaboration with Socket.io, and JWT authentication.</p>",
      projectUrl: "github.com/hoangpham-dev/trello-clone",
      deployUrl: "trello-clone.hoangpham.dev",
      technologies: "React, Node.js, Express, MongoDB, Socket.io, Tailwind CSS",
    },
    {
      id: "proj-2",
      name: "Smart Block Text Editor (Notion Clone)",
      role: "Frontend Developer (Personal Project)",
      description:
        "<p>Block-style text editor supporting markdown shortcuts, image uploads, IndexedDB offline storage, and cloud sync. Optimized rendering performance for thousands of blocks.</p>",
      projectUrl: "github.com/hoangpham-dev/notion-clone",
      deployUrl: "editor.hoangpham.dev",
      technologies: "Next.js, TipTap Editor, Tailwind CSS, TypeScript, Zustand",
    },
  ],
  skills: [
    { id: "sk-1", name: "React / Next.js", level: "EXPERT" },
    { id: "sk-2", name: "TypeScript", level: "EXPERT" },
    { id: "sk-3", name: "HTML5 / CSS3 / TailwindCSS", level: "EXPERT" },
    { id: "sk-4", name: "Zustand / Redux / State Management", level: "ADVANCED" },
    { id: "sk-5", name: "Node.js / Express", level: "INTERMEDIATE" },
    { id: "sk-6", name: "RESTful API / GraphQL", level: "ADVANCED" },
    { id: "sk-7", name: "Git / CI-CD (GitHub Actions)", level: "ADVANCED" },
  ],
  sectionsOrder: ["personal", "summary", "experience", "projects", "education", "skills"],
  style: {
    fontFamily: "font-sans",
    themeColor: "teal",
    textSize: "base",
    marginSize: "base",
  },
  selectedTemplate: "modern",
  cvLanguage: "en",
};
