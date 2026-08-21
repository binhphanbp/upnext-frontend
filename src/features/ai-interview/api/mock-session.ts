/**
 * The scripted interview used by the demo driver.
 *
 * Every candidate answer below is written the way people actually speak under
 * pressure — hesitations included — so the delivery metrics have real filler
 * words and pauses to find rather than a synthetic clean paragraph.
 */

import { emptyDelivery } from "../lib/delivery-metrics";
import type { InterviewQuestion, QuestionScore } from "../types";

export type ScriptedChunk = {
  text: string;
  /** Gap before this chunk — long values become visible pauses in the metrics. */
  delayMs: number;
  /** Closes the interim segment and commits it to the transcript. */
  commits?: boolean;
};

export type ScriptedTurn = {
  question: InterviewQuestion;
  /** Spoken by the interviewer to introduce the question. */
  interviewerLine: string;
  candidateChunks: ScriptedChunk[];
  /** Short spoken beat after the answer, before the evaluation appears. */
  acknowledgement: string;
  score: Omit<QuestionScore, "delivery" | "transcript"> & { fallbackTranscript: string };
};

const TOTAL = 5;

function question(
  index: number,
  partial: Omit<InterviewQuestion, "index" | "total">,
): InterviewQuestion {
  return { ...partial, index, total: TOTAL };
}

export const SCRIPTED_TURNS: ScriptedTurn[] = [
  {
    question: question(1, {
      id: "q1",
      text: "Bạn xử lý vấn đề N+1 query trong Prisma hoặc TypeORM như thế nào?",
      competency: "database",
      difficulty: "medium",
      expectedSignals: [
        "Nhận diện đúng nguyên nhân: truy vấn quan hệ trong vòng lặp",
        "Nêu giải pháp eager loading / include / join",
        "Biết cách phát hiện bằng query log hoặc APM",
        "Nêu trade-off giữa join lớn và nhiều truy vấn nhỏ",
      ],
      timeLimitSec: 180,
    }),
    interviewerLine:
      "Chào bạn, mình sẽ phỏng vấn bạn cho vị trí Backend Developer. Câu đầu tiên về database nhé. Bạn xử lý vấn đề N+1 query trong Prisma hoặc TypeORM như thế nào?",
    candidateChunks: [
      { text: "Ừm,", delayMs: 900 },
      { text: " N+1 là khi mình query một danh sách", delayMs: 700 },
      {
        text: " rồi trong vòng lặp lại query tiếp quan hệ của từng bản ghi.",
        delayMs: 600,
        commits: true,
      },
      { text: "Ví dụ lấy 100 job", delayMs: 1_400 },
      { text: " rồi lặp qua từng job để lấy company", delayMs: 500 },
      { text: " thì thành 101 câu query.", delayMs: 600, commits: true },
      { text: "Cách mình hay dùng là", delayMs: 1_100 },
      { text: " kiểu như dùng include của Prisma", delayMs: 700 },
      { text: " để nó join sẵn trong một câu.", delayMs: 600, commits: true },
      { text: "Còn để phát hiện thì mình bật query log lên xem", delayMs: 1_600 },
      { text: " nếu thấy cùng một câu lặp nhiều lần là biết ngay.", delayMs: 700, commits: true },
    ],
    acknowledgement: "Rõ rồi, cảm ơn bạn.",
    score: {
      questionId: "q1",
      questionText: "Bạn xử lý vấn đề N+1 query trong Prisma hoặc TypeORM như thế nào?",
      score: 76,
      dimensions: {
        technicalCorrectness: 30,
        relevance: 17,
        depth: 10,
        clarity: 12,
        practicalEvidence: 7,
      },
      strengths: [
        "Định nghĩa đúng bản chất N+1 và minh họa bằng ví dụ cụ thể (100 job → 101 query)",
        "Nêu được cách phát hiện thực tế bằng query log",
      ],
      missingPoints: [
        "Chưa nhắc tới DataLoader hoặc batching khi số quan hệ lớn",
        "Chưa nêu trade-off: join rộng có thể tạo tích Descartes và nặng hơn nhiều truy vấn nhỏ",
      ],
      followUpFocus: ["Trade-off giữa join và batching"],
      suggestedAnswer:
        "N+1 xảy ra khi truy vấn quan hệ được thực hiện trong vòng lặp thay vì gộp lại. Ba hướng xử lý: (1) eager loading bằng include/relations để ORM sinh join; (2) batching bằng DataLoader khi số quan hệ lớn hoặc dữ liệu đến từ nhiều nguồn; (3) truy vấn riêng theo tập id rồi map lại trong bộ nhớ. Chọn hướng nào phụ thuộc kích thước quan hệ: join rộng trên quan hệ một-nhiều có thể nhân số dòng và nặng hơn hai truy vấn nhỏ. Phát hiện bằng query log, hoặc tốt hơn là APM có phân rã theo span.",
      adaptiveDecision: {
        action: "deepen",
        reason: "Trả lời đúng nền tảng nhưng chưa chạm tới trade-off — đào sâu cùng chủ đề.",
      },
      fallbackTranscript:
        "Ừm, N+1 là khi mình query một danh sách rồi trong vòng lặp lại query tiếp quan hệ của từng bản ghi. Ví dụ lấy 100 job rồi lặp qua từng job để lấy company thì thành 101 câu query. Cách mình hay dùng là kiểu như dùng include của Prisma để nó join sẵn trong một câu. Còn để phát hiện thì mình bật query log lên xem nếu thấy cùng một câu lặp nhiều lần là biết ngay.",
    },
  },
  {
    question: question(2, {
      id: "q2",
      text: "Khi nào bạn chọn cursor pagination thay vì offset pagination? Đánh đổi là gì?",
      competency: "api_design",
      difficulty: "medium",
      followUpOfId: "q1",
      expectedSignals: [
        "Offset chậm dần khi offset lớn do phải quét bỏ",
        "Cursor ổn định khi dữ liệu thay đổi giữa các trang",
        "Cursor không nhảy được tới trang bất kỳ",
        "Cần index trên cột sắp xếp",
      ],
      timeLimitSec: 180,
    }),
    interviewerLine:
      "Câu tiếp theo vẫn ở tầng dữ liệu nhưng nhìn từ phía API. Khi nào bạn chọn cursor pagination thay vì offset pagination, và đánh đổi là gì?",
    candidateChunks: [
      { text: "Offset thì đơn giản hơn,", delayMs: 800 },
      { text: " mình chỉ cần limit với offset thôi.", delayMs: 600, commits: true },
      { text: "Nhưng mà khi offset lớn", delayMs: 1_300 },
      { text: " ví dụ trang thứ một nghìn", delayMs: 600 },
      { text: " thì database vẫn phải quét qua hết phần trước rồi bỏ đi", delayMs: 700 },
      { text: " nên càng về sau càng chậm.", delayMs: 500, commits: true },
      { text: "Cursor thì mình lưu lại giá trị của bản ghi cuối", delayMs: 1_500 },
      { text: " rồi query tiếp từ đó, nên nó ổn định hơn", delayMs: 800 },
      { text: " kể cả khi có bản ghi mới chèn vào giữa.", delayMs: 600, commits: true },
      { text: "Đổi lại là", delayMs: 1_800 },
      { text: " à, không nhảy thẳng tới một trang bất kỳ được.", delayMs: 700, commits: true },
    ],
    acknowledgement: "Tốt, bạn nắm được điểm đánh đổi chính.",
    score: {
      questionId: "q2",
      questionText: "Khi nào bạn chọn cursor pagination thay vì offset pagination? Đánh đổi là gì?",
      score: 84,
      dimensions: {
        technicalCorrectness: 35,
        relevance: 18,
        depth: 12,
        clarity: 13,
        practicalEvidence: 6,
      },
      strengths: [
        "Giải thích chính xác vì sao offset lớn chậm — quét rồi bỏ, không phải nhảy trực tiếp",
        "Nêu đúng điểm mạnh của cursor: ổn định khi dữ liệu thay đổi giữa các lần gọi",
        "Chủ động nêu đánh đổi mà không cần hỏi thêm",
      ],
      missingPoints: [
        "Chưa nhắc yêu cầu index trên cột dùng làm cursor",
        "Chưa nói tới trường hợp cursor phải gồm nhiều cột khi giá trị sắp xếp trùng nhau",
      ],
      followUpFocus: ["Thiết kế cursor ổn định khi có giá trị trùng"],
      suggestedAnswer:
        "Offset phù hợp với dữ liệu nhỏ, ổn định và khi người dùng cần nhảy tới trang bất kỳ. Cursor phù hợp với danh sách dài, thay đổi liên tục hoặc cuộn vô hạn: truy vấn dùng WHERE (sort_col, id) > (last_sort, last_id) nên chi phí không tăng theo độ sâu. Đánh đổi: mất khả năng nhảy trang, cursor phải mã hóa đủ khóa để không bỏ sót khi giá trị sắp xếp trùng, và cột sắp xếp bắt buộc phải có index — nếu không cursor cũng chậm như offset.",
      adaptiveDecision: {
        action: "switch_topic",
        reason:
          "Điểm ≥ 80 ở chủ đề dữ liệu — chuyển sang thiết kế hệ thống để mở rộng phổ đánh giá.",
      },
      fallbackTranscript:
        "Offset thì đơn giản hơn, mình chỉ cần limit với offset thôi. Nhưng mà khi offset lớn ví dụ trang thứ một nghìn thì database vẫn phải quét qua hết phần trước rồi bỏ đi nên càng về sau càng chậm. Cursor thì mình lưu lại giá trị của bản ghi cuối rồi query tiếp từ đó, nên nó ổn định hơn kể cả khi có bản ghi mới chèn vào giữa. Đổi lại là à, không nhảy thẳng tới một trang bất kỳ được.",
    },
  },
  {
    question: question(3, {
      id: "q3",
      text: "Hệ thống cần gửi email khi ứng viên nộp đơn. Thiết kế luồng sao cho email không bị mất, kể cả khi service email lỗi.",
      competency: "system_design",
      difficulty: "hard",
      expectedSignals: [
        "Tách gửi email khỏi request đồng bộ",
        "Hàng đợi có retry và backoff",
        "Idempotency để không gửi trùng khi retry",
        "Dead-letter queue và khả năng quan sát",
        "Vấn đề ghi DB và đẩy queue không cùng transaction (outbox)",
      ],
      timeLimitSec: 240,
    }),
    interviewerLine:
      "Bạn nắm chắc phần dữ liệu rồi, mình chuyển sang thiết kế hệ thống. Hệ thống cần gửi email khi ứng viên nộp đơn. Bạn thiết kế luồng thế nào để email không bị mất, kể cả khi service email lỗi?",
    candidateChunks: [
      { text: "Chắc chắn là không gửi trực tiếp trong request rồi,", delayMs: 1_000 },
      { text: " vì nếu service email chậm thì API cũng chậm theo.", delayMs: 700, commits: true },
      { text: "Mình sẽ đẩy vào một cái queue,", delayMs: 1_600 },
      { text: " kiểu như Redis với BullMQ,", delayMs: 800 },
      { text: " rồi worker nhận và gửi.", delayMs: 600, commits: true },
      { text: "Nếu gửi lỗi thì retry", delayMs: 2_100 },
      { text: " mấy lần, có backoff.", delayMs: 700, commits: true },
      { text: "Ừm...", delayMs: 2_400 },
      {
        text: " retry nhiều lần vẫn lỗi thì mình log lại để xử lý sau.",
        delayMs: 900,
        commits: true,
      },
    ],
    acknowledgement: "Được, mình ghi nhận.",
    score: {
      questionId: "q3",
      questionText:
        "Hệ thống cần gửi email khi ứng viên nộp đơn. Thiết kế luồng sao cho email không bị mất, kể cả khi service email lỗi.",
      score: 58,
      dimensions: {
        technicalCorrectness: 24,
        relevance: 15,
        depth: 7,
        clarity: 9,
        practicalEvidence: 3,
      },
      strengths: [
        "Nhận ra ngay phải tách khỏi request đồng bộ và giải thích được lý do",
        "Chọn đúng nhóm công cụ (queue + worker) cho bài toán",
      ],
      missingPoints: [
        "Không nhắc tới idempotency — retry hiện tại sẽ gửi trùng email cho ứng viên",
        "Không xử lý trường hợp ghi database thành công nhưng đẩy queue thất bại (cần outbox hoặc transaction)",
        "Dead-letter queue chỉ được mô tả là “log lại”, chưa có cơ chế phát lại",
        "Không nêu cách quan sát: đo gì để biết email đang tồn đọng",
      ],
      followUpFocus: ["Idempotency key", "Transactional outbox"],
      suggestedAnswer:
        "Ghi bản ghi đơn ứng tuyển và một bản ghi outbox trong cùng một transaction, sau đó một tiến trình riêng đọc outbox và đẩy vào queue — như vậy không có khe hở giữa “đã lưu đơn” và “đã lên hàng đợi”. Worker gửi email với idempotency key theo applicationId + loại email, để retry không tạo email trùng. Retry có backoff lũy thừa, quá số lần thì chuyển sang dead-letter queue có thể phát lại thủ công. Về quan sát: đo độ sâu hàng đợi, tuổi message cũ nhất và tỉ lệ vào DLQ; cảnh báo theo tuổi message chứ không chỉ theo số lượng.",
      adaptiveDecision: {
        action: "simplify",
        reason:
          "Điểm < 60 ở system design — quay lại câu dễ hơn cùng nhóm để xác định đúng ngưỡng năng lực.",
      },
      fallbackTranscript:
        "Chắc chắn là không gửi trực tiếp trong request rồi, vì nếu service email chậm thì API cũng chậm theo. Mình sẽ đẩy vào một cái queue, kiểu như Redis với BullMQ, rồi worker nhận và gửi. Nếu gửi lỗi thì retry mấy lần, có backoff. Ừm... retry nhiều lần vẫn lỗi thì mình log lại để xử lý sau.",
    },
  },
  {
    question: question(4, {
      id: "q4",
      text: "Bạn viết test cho một service có phụ thuộc database như thế nào?",
      competency: "testing",
      difficulty: "easy",
      followUpOfId: "q3",
      expectedSignals: [
        "Phân biệt unit test và integration test",
        "Mock repository ở unit test",
        "Dùng database thật hoặc container ở integration test",
        "Đảm bảo test độc lập, dữ liệu được dọn giữa các lần chạy",
      ],
      timeLimitSec: 150,
    }),
    interviewerLine:
      "Mình quay lại một câu nhẹ hơn. Bạn viết test cho một service có phụ thuộc database như thế nào?",
    candidateChunks: [
      { text: "Tùy loại test.", delayMs: 700 },
      { text: " Unit test thì mình mock cái repository đi,", delayMs: 600 },
      { text: " chỉ test logic trong service thôi.", delayMs: 600, commits: true },
      { text: "Còn integration test thì mình chạy database thật", delayMs: 1_200 },
      {
        text: " trong Docker, mỗi lần chạy thì migrate rồi seed lại.",
        delayMs: 700,
        commits: true,
      },
      { text: "Quan trọng là test không được phụ thuộc nhau,", delayMs: 1_300 },
      { text: " mỗi test tự chuẩn bị dữ liệu của nó", delayMs: 600 },
      { text: " và dọn sau khi chạy xong.", delayMs: 500, commits: true },
    ],
    acknowledgement: "Rõ ràng, cảm ơn bạn.",
    score: {
      questionId: "q4",
      questionText: "Bạn viết test cho một service có phụ thuộc database như thế nào?",
      score: 82,
      dimensions: {
        technicalCorrectness: 33,
        relevance: 18,
        depth: 11,
        clarity: 14,
        practicalEvidence: 6,
      },
      strengths: [
        "Phân tầng đúng: mock ở unit test, database thật ở integration test",
        "Nêu được nguyên tắc test độc lập và tự dọn dữ liệu",
        "Trả lời gọn, không lan man",
      ],
      missingPoints: [
        "Chưa nhắc Testcontainers hoặc cách cô lập bằng transaction rollback",
        "Chưa nói về tốc độ: integration test chạy chậm thì chiến lược chia tầng ra sao",
      ],
      followUpFocus: [],
      suggestedAnswer:
        "Unit test: thay repository bằng test double, chỉ kiểm tra nhánh logic và điều kiện biên. Integration test: chạy PostgreSQL thật qua Testcontainers, migrate một lần cho cả suite, cô lập từng test bằng transaction rollback thay vì truncate để giữ tốc độ. Giữ tỉ lệ nghiêng về unit test, chỉ dùng integration cho ranh giới thực sự (truy vấn phức tạp, ràng buộc DB, transaction).",
      adaptiveDecision: {
        action: "follow_up",
        reason: "Điểm 60–79 ở nhóm trước đó đã hồi phục — chốt bằng một câu hành vi.",
      },
      fallbackTranscript:
        "Tùy loại test. Unit test thì mình mock cái repository đi, chỉ test logic trong service thôi. Còn integration test thì mình chạy database thật trong Docker, mỗi lần chạy thì migrate rồi seed lại. Quan trọng là test không được phụ thuộc nhau, mỗi test tự chuẩn bị dữ liệu của nó và dọn sau khi chạy xong.",
    },
  },
  {
    question: question(5, {
      id: "q5",
      text: "Kể về một lần bạn phát hiện lỗi trên production. Bạn đã làm gì?",
      competency: "behavioral",
      difficulty: "medium",
      expectedSignals: [
        "Có tình huống cụ thể, không nói chung chung",
        "Ưu tiên giảm thiệt hại trước khi tìm nguyên nhân gốc",
        "Có bước thông báo cho người liên quan",
        "Rút ra thay đổi để lỗi không lặp lại",
      ],
      timeLimitSec: 210,
    }),
    interviewerLine:
      "Câu cuối cùng, mình muốn nghe một tình huống thật. Kể về một lần bạn phát hiện lỗi trên production và bạn đã làm gì.",
    candidateChunks: [
      { text: "Có một lần API tạo đơn ứng tuyển trả lỗi 500", delayMs: 900 },
      { text: " nhưng chỉ với một số user thôi.", delayMs: 600, commits: true },
      { text: "Mình xem log thì thấy lỗi unique constraint,", delayMs: 1_400 },
      { text: " do user bấm nộp hai lần nhanh quá", delayMs: 700 },
      { text: " nên tạo hai bản ghi cùng lúc.", delayMs: 500, commits: true },
      { text: "Lúc đó mình sửa nhanh bằng cách", delayMs: 1_700 },
      { text: " disable nút sau khi bấm ở frontend trước,", delayMs: 700 },
      { text: " rồi sau đó mới thêm ràng buộc ở backend.", delayMs: 600, commits: true },
      { text: "Sau vụ đó bọn mình thêm alert cho lỗi 5xx", delayMs: 1_500 },
      { text: " để biết sớm hơn chứ không đợi user báo.", delayMs: 700, commits: true },
    ],
    acknowledgement: "Cảm ơn bạn, đó là câu cuối. Mình tổng hợp kết quả nhé.",
    score: {
      questionId: "q5",
      questionText: "Kể về một lần bạn phát hiện lỗi trên production. Bạn đã làm gì?",
      score: 80,
      dimensions: {
        technicalCorrectness: 30,
        relevance: 18,
        depth: 11,
        clarity: 13,
        practicalEvidence: 8,
      },
      strengths: [
        "Tình huống cụ thể, có thể kiểm chứng — không trả lời chung chung",
        "Phân biệt được bước giảm thiệt hại trước và sửa gốc sau",
        "Có hành động phòng ngừa sau sự cố (thêm alert 5xx)",
      ],
      missingPoints: [
        "Không nói đã thông báo cho ai, hoặc có ai bị ảnh hưởng bao nhiêu lâu",
        "Chưa nêu vì sao chọn sửa frontend trước — người nghe có thể hiểu nhầm là vá tạm cho xong",
      ],
      followUpFocus: [],
      suggestedAnswer:
        "Cấu trúc STAR giúp câu trả lời này mạnh hơn: nêu bối cảnh (bao nhiêu user bị ảnh hưởng, trong bao lâu), hành động theo thứ tự ưu tiên (chặn thiệt hại → thông báo → sửa gốc), và kết quả đo được (tỉ lệ 5xx về 0, thời gian phát hiện giảm từ X xuống Y). Nêu rõ lý do chọn vá ở frontend trước — mua thời gian trong lúc chuẩn bị ràng buộc unique và migration ở backend — để người nghe thấy đó là quyết định có cân nhắc.",
      adaptiveDecision: { action: "complete", reason: "Đã đủ 5 câu theo cấu hình phiên." },
      fallbackTranscript:
        "Có một lần API tạo đơn ứng tuyển trả lỗi 500 nhưng chỉ với một số user thôi. Mình xem log thì thấy lỗi unique constraint, do user bấm nộp hai lần nhanh quá nên tạo hai bản ghi cùng lúc. Lúc đó mình sửa nhanh bằng cách disable nút sau khi bấm ở frontend trước, rồi sau đó mới thêm ràng buộc ở backend. Sau vụ đó bọn mình thêm alert cho lỗi 5xx để biết sớm hơn chứ không đợi user báo.",
    },
  },
];

export const GREETING =
  "Xin chào, mình là trợ lý phỏng vấn của UpNext. Phiên này gồm 5 câu, khoảng 20 phút. Bạn cứ trả lời tự nhiên, có thể ngắt lời mình bất cứ lúc nào. Sẵn sàng chưa?";

export const CLOSING =
  "Phiên phỏng vấn kết thúc. Mình đã chấm xong toàn bộ và tổng hợp thành báo cáo, bạn xem ngay bên dưới nhé.";

export const REPORT_SUMMARY = {
  strengths: [
    "Nền tảng dữ liệu vững: giải thích được cơ chế bên dưới chứ không chỉ nêu tên giải pháp",
    "Chủ động nêu đánh đổi ở câu pagination mà không cần gợi ý",
    "Câu chuyện sự cố production cụ thể, có hành động phòng ngừa sau đó",
  ],
  priorities: [
    "Thiết kế hệ thống là khoảng cách lớn nhất — thiếu idempotency và xử lý ghi-rồi-đẩy-queue không nguyên tử",
    "Trả lời thường dừng ở “làm gì”, ít khi nói “vì sao chọn cách đó thay vì cách khác”",
    "Chưa đưa số liệu vào câu trả lời: quy mô, thời gian, mức cải thiện",
  ],
  nextSteps: [
    {
      title: "Ôn lại độ tin cậy trong hệ thống bất đồng bộ",
      detail:
        "Tập trung vào ba khái niệm đã hụt: idempotency key, transactional outbox, dead-letter queue. Thử vẽ lại luồng gửi email ở câu 3 và tự chỉ ra chỗ có thể mất message.",
    },
    {
      title: "Luyện nói trade-off thành thói quen",
      detail:
        "Sau mỗi câu trả lời kỹ thuật, thêm một câu bắt đầu bằng “Đánh đổi ở đây là…”. Bạn đã làm tốt điều này ở câu 2 — nhân rộng sang các câu còn lại.",
    },
    {
      title: "Chuẩn bị số liệu cho các câu hành vi",
      detail:
        "Chuẩn bị sẵn 3 tình huống theo cấu trúc STAR, mỗi tình huống có ít nhất một con số đo được.",
    },
  ],
};

export function initialQuestionScore(turn: ScriptedTurn): QuestionScore {
  const { fallbackTranscript, ...rest } = turn.score;
  return { ...rest, transcript: fallbackTranscript, delivery: emptyDelivery() };
}
