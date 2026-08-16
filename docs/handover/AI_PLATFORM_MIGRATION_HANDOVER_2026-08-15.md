# Bàn giao nền tảng AI UpNext

> Cập nhật: 16/08/2026  
> Phạm vi: `upnext-frontend`, `upnext-be`, `upnext-ai`, `upnext-infra`  
> Mục tiêu: giúp Agent tiếp theo tiếp tục an toàn việc tách dần các năng lực AI khỏi backend sang dịch vụ `upnext-ai`.

## 1. Đọc trước khi thực hiện

- Không đọc, sửa hoặc chạy bất kỳ thứ gì trong thư mục `recruitsmart-full`.
- Không reset, clean, checkout hay ghi đè các worktree đang bẩn. Những thay đổi cục bộ hiện có thuộc về người dùng hoặc tác vụ khác.
- Không đưa API key, JWT secret, Cloudinary key, token GitHub/GHCR, CV, prompt hoặc dữ liệu ứng viên vào Git, log, ảnh chụp, issue hay tài liệu.
- Không chạy `docker compose down`, `--remove-orphans`, xoá container/volume diện rộng trên VPS. VPS đang có cả các container production và staging cùng tồn tại.
- Frontend **không bao giờ** gọi `upnext-ai` trực tiếp. Mọi AI request đi theo `Frontend → Backend → AI service`.

## 2. Kiến trúc đích đã thống nhất

```mermaid
flowchart LR
  FE["UpNext Frontend\nUI / phiên đăng nhập"] -->|"HTTPS, user session"| BE["UpNext Backend\nAuth, RBAC, dữ liệu nghiệp vụ, audit"]
  BE -->|"Private Docker network\nshort-lived signed internal JWT"| AI["UpNext AI (FastAPI)\nprompt, inference, schema validation, streaming"]
  AI -->|"provider credentials only here"| LLM["Gemini / LLM provider"]
  BE <--> DB[("PostgreSQL / pgvector")]

  AI -. "Không ghi DB nghiệp vụ\nkhông public port" .- BE
```

### Trách nhiệm bắt buộc

| Thành phần     | Được làm                                                                                                     | Không được làm                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Frontend       | hiển thị trạng thái, gửi yêu cầu người dùng, hiển thị stream                                                 | gọi AI nội bộ, giữ provider key, tự quyết định quyền truy cập             |
| Backend        | xác thực/RBAC, lấy context tối thiểu, tool/business logic, audit, feature flag/canary, DB write              | lộ provider key hoặc cho AI ghi DB trực tiếp                              |
| `upnext-ai`    | adapter provider, prompt/version, output schema, retry/timeout, embeddings/inference, telemetry đã redaction | public Internet route, business authorization, dữ liệu bền vững nghiệp vụ |
| Infrastructure | private network, secrets/health/resource limit/image rollout                                                 | mở port/Nginx cho AI service                                              |

## 3. Trạng thái đã làm

### 3.1 Hạ tầng và gateway

| Hạng mục                    | Trạng thái                                | Bằng chứng / lưu ý                                                                                                   |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Repo FastAPI `upnext-ai`    | Đã tạo                                    | Repo riêng ngang cấp FE/BE/infra; có Dockerfile, health endpoints, contract export, pytest/ruff/pyright.             |
| Dịch vụ AI staging private  | Đã merge ở Infra PR #1                    | Có profile `ai`, không publish host port và không có Nginx route. Chỉ backend staging được gọi qua Docker network.   |
| AI gateway trong BE         | Đã merge ở BE PR #133 và các PR tiếp theo | BE ký JWT nội bộ ngắn hạn; AI xác minh issuer/audience/environment/scope.                                            |
| Tách Candidate Copilot      | Đã triển khai theo capability             | Luồng candidate copilot đi qua gateway riêng, không nên gọi trực tiếp LLM từ UI.                                     |
| Chuẩn hoá structured output | Đã có nhánh/commit sửa                    | Có thay đổi tương thích JSON Schema của Gemini; cần xác minh image chứa thay đổi đó đã thật sự được rollout staging. |
| CV screening batch          | Đã merge theo chuỗi AI PR #4 / BE PR #143 | Đi theo capability riêng, không di chuyển hàng loạt.                                                                 |
| Embeddings                  | Đã merge theo chuỗi AI PR #5 / BE PR #144 | Có private embedding gateway và fallback được cấu hình.                                                              |
| Trích xuất dữ liệu JD       | Đã merge theo chuỗi AI PR #6 / BE PR #145 | Có capability extraction riêng và canary ở BE.                                                                       |
| Sinh JD (JD generation)     | Đã merge AI PR #8 / BE PR #148            | CI đỏ do ruff line-length đã sửa; chạy đủ quality suite trước khi merge.                                             |
| Quét giấy phép kinh doanh   | Đã merge AI PR #12 / BE PR #149           | Scope riêng `company-license:extract`; token đọc JD không đọc được giấy phép công ty.                                |
| Nghiên cứu lương (grounded) | Đã merge AI PR #13 / BE PR #150           | Capability cuối cùng còn gọi Gemini trực tiếp. Scope riêng `research:grounded`. Xem mục 4.3 về bẫy citation.         |

### 3.2 Staging đã xác minh trực tiếp

Các kiểm tra sau đã từng thành công trên VPS `/opt/upnext`:

- `upnext-ai-staging` chạy `healthy`.
- `upnext-backend-staging` chạy `healthy`; `/health` trả database OK.
- Backend gọi được `http://ai-staging:8000/health/live` và nhận HTTP 200.
- Backend và AI cùng `APP_ENV/AI_ENVIRONMENT=staging`; fingerprint SHA-256 của `AI_INTERNAL_JWT_SECRET` trùng khớp.
- Sau khi tái tạo bằng Compose project `upnext`, cả AI và backend cùng mạng `upnext_upnext-staging`.
- Đã tạo backup PostgreSQL hợp lệ trước thao tác recovery:  
  `/opt/upnext/backups/upnext-staging-before-pgvector-recovery-20260811T080949Z.dump`  
  (file backup 0 byte cùng tên thời điểm sớm hơn phải bỏ qua).

### 3.3 Migrations pgvector

Đã xảy ra sự cố P3009/P3012 trong giai đoạn deploy pgvector. Sau recovery, `_prisma_migrations` từng có:

- Một bản ghi migration `20260719090000_use_pgvector_for_cv_screening` đã rolled back, `applied_steps_count = 0`.
- Một bản ghi cùng migration hoàn thành, `applied_steps_count = 1`.

Điều này **không tự động chứng minh** staging hiện hoàn toàn sạch. Agent tiếp theo phải chạy `prisma migrate status` bằng image/backend hiện hành trước mọi rollout AI mới.

## 4. Những gì chưa hoàn thành hoặc chưa được chứng minh

> Cập nhật 16/08/2026. Toàn bộ mục P0 của bản 15/08 đã đóng; nội dung dưới đây thay thế chúng.

### 4.1 Ba lỗi từng che nhau, nay đã tìm ra và sửa

`AI_INVALID_OUTPUT` trên staging không phải một lỗi mà là ba, xếp chồng lên nhau. Mỗi lỗi khi
xuất hiện đơn lẻ đều trông giống lỗi schema, nên nhóm đã đuổi theo hướng sai nhiều ngày:

1. **Gemini chặn theo địa lý.** VPS nhận `HTTP 400 FAILED_PRECONDITION: User location is not
supported for the API use.` Đọc theo nghĩa đen thì đó là lỗi request, nên nó bị gộp vào lỗi
   chung. Đã tách thành mã riêng `AI_PROVIDER_REGION_BLOCKED` (AI PR #9) — retry, đổi model hay
   sửa schema đều vô ích với lỗi này, và việc gộp chung chính là thứ làm nó bị hiểu nhầm.
2. **Client pin sai `api_version="v1"`.** JSON mode không được phục vụ trên `v1`; mọi structured
   output chết trong khi embeddings và streaming vẫn chạy, nên triệu chứng trông "lúc được lúc
   không". Đã đổi sang `v1beta` (AI PR #10).
3. **Thiếu `aiohttp`.** `google-genai` đánh dấu nó optional nhưng `_aiter_response_stream` vẫn
   dereference `aiohttp.ClientResponse`. Streaming chết bằng `NameError` **sau khi** Gemini đã
   trả 200, nên log đọc như "thành công rồi mất kết nối". Đã pin dependency (AI PR #11) kèm test
   canh để lỗi không quay lại im lặng.

Bài học giữ lại: **khi verify, tắt hết `*_FALLBACK_TO_GEMINI`** để lỗi lộ ra thay vì bị fallback
che. Và dùng trường `model` trong event `done` để biết request đi đường nào: `upnext-ai/gemini`
là qua service, `gemini-2.5-flash` là gọi thẳng Gemini.

### 4.2 Còn tồn đọng

| Hạng mục                        | Trạng thái                                  | Ghi chú                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemini chặn địa lý trên VPS     | **Chưa xử lý, người dùng chủ động hoãn**    | Đã probe lại ngày 16/08: vẫn `FAILED_PRECONDITION`. Mọi tính năng AI trên `staging.upnext.works` hiện không chạy được, bất kể cấu hình flag. Ba hướng: bật billing, chuyển Vertex AI, hoặc egress proxy. Proxy là rẻ nhất — `google-genai` dùng httpx với `trust_env=True`, chỉ cần set `HTTPS_PROXY` trong `ai.staging.env`, không đụng code.                                        |
| Push notification (FCM)         | **Chưa làm, người dùng tự nghiên cứu**      | Cần Firebase Web config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) và VAPID key.                                                                                                                                                                                                                                                            |
| Staging mới bật 2/5 capability  | **Cần bật nốt**                             | `backend.staging.env` chỉ có `AI_LLM_PROVIDER` và `AI_EMBEDDING_PROVIDER` = `upnext-ai`. Ba cờ `AI_JOB_POST_GENERATION_PROVIDER`, `AI_JOB_POST_EXTRACTION_PROVIDER`, `AI_COMPANY_LICENSE_PROVIDER` chưa được set nên rơi về `gemini`, tức đang gọi thẳng Gemini. Nếu mục tiêu là giả lập production thì đây là lỗ hổng: ba capability đó sẽ lần đầu chạy đường mới ngay lúc lên prod. |
| `AI_GROUNDED_RESEARCH_PROVIDER` | **Chưa bật**                                | Mặc định `gemini`. Bật sau khi gỡ geo-block.                                                                                                                                                                                                                                                                                                                                          |
| Production chưa có cấu hình AI  | **Đúng thiết kế, không phải việc tồn đọng** | `backend.prod.env` không có `GEMINI_API_KEY` lẫn biến `AI_*` nào, và không tồn tại `ai.prod.env`. Prod chỉ nhận code từ `main` khi đã ổn định; hiện mọi thứ đang test trên `staging.upnext.works` qua nhánh `dev`/`develop`. Đừng coi đây là thiếu sót cần sửa.                                                                                                                       |

### 4.3 Bẫy cần biết: citation chỉ bám vào văn xuôi

Với capability grounded (salary research), Gemini chỉ trả `groundingChunks` khi câu trả lời có
đoạn text để quy chiếu. Đã đo trực tiếp: prompt production hiện tại yêu cầu `summary` và
`evidenceNotes` bằng tiếng Việt nên mỗi lần chạy nhận 4–7 nguồn và 5–6 search query. Nhưng khi
thử prompt JSON gọn không có field văn xuôi, `groundingChunks` về **0** dù search vẫn chạy.

Hệ quả: **nếu ai sửa prompt bỏ `summary`/`evidenceNotes`, toàn bộ citation sẽ chết âm thầm**,
`validateResult` sẽ loại kết quả vì không đủ 2 nguồn, và salary research quay lại trả `null`
mà không có lỗi nào. Đừng "tối ưu" prompt đó nếu chưa đo lại số nguồn.

## 5. Trạng thái worktree khi bàn giao

> Các SHA/nhánh dưới đây chỉ là snapshot ngày 16/08/2026. Trước khi làm phải `git fetch --prune`
> và so sánh remote; không pull đè worktree bẩn.

| Repo                                  | Snapshot đã quan sát                                                                        | Cảnh báo                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `D:\Workspace\upnext\upnext-frontend` | Branch `codex/cv-builder-versioned-apply`, bẩn: `public-header.tsx`, thư mục `ai-interview` | Thay đổi của người dùng/tác vụ khác. Không reset, không commit kèm. Muốn sửa tài liệu thì tạo worktree riêng từ `origin/develop`. |
| `D:\Workspace\upnext\upnext-backend`  | Đã chuyển về `dev` và đồng bộ remote                                                        | Vẫn nên làm việc trong worktree riêng tạo từ `origin/dev`.                                                                        |
| `D:\Workspace\upnext\upnext-ai`       | `develop`, đồng bộ remote                                                                   | Đã chứa PR #9/#10/#11/#12/#13.                                                                                                    |
| `D:\Workspace\upnext\upnext-infra`    | `main`                                                                                      | Dùng đúng Compose project name `upnext` trên VPS.                                                                                 |

Cách làm đã thống nhất với người dùng: **mỗi tác vụ một worktree riêng tạo từ remote branch**, xong
việc thì xoá. Không sửa trực tiếp trong checkout dùng chung đang bẩn — đã có lần commit nhầm tài
liệu vào nhánh feature của người khác vì bỏ qua quy tắc này.

## 6. Cấu hình local chuẩn

### 6.1 Quy tắc địa chỉ service

| Cách chạy BE                                          | `AI_SERVICE_URL` phù hợp                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| BE chạy trực tiếp trên máy host, AI FastAPI chạy host | `http://127.0.0.1:8000`                                                                              |
| BE chạy trong Docker Compose cùng AI                  | tên DNS service trên Docker network, ví dụ `http://upnext-ai:8000` (xác minh tên thực trong compose) |
| Staging Docker Compose                                | `http://ai-staging:8000`                                                                             |

`127.0.0.1` bên trong container là chính container đó, không phải máy host hay container AI khác.

### 6.2 Biến môi trường (chỉ tên biến)

Backend dùng gateway AI cần kiểm tra tên/giá trị với schema của `origin/dev`:

```dotenv
AI_LLM_PROVIDER=upnext-ai
AI_SERVICE_URL=http://127.0.0.1:8000
AI_INTERNAL_JWT_SECRET=<shared-secret-unique-to-be-and-ai>
AI_SERVICE_FALLBACK_TO_GEMINI=true

AI_EMBEDDING_PROVIDER=upnext-ai
AI_EMBEDDING_SERVICE_TIMEOUT_MS=20000
AI_EMBEDDING_FALLBACK_TO_GEMINI=true
```

AI service local:

```dotenv
AI_INTERNAL_JWT_SECRET=<exactly-the-same-shared-secret>
AI_ENVIRONMENT=development
AI_INTERNAL_JWT_ISSUER=upnext-be
AI_INTERNAL_JWT_AUDIENCE=upnext-ai
AI_INTERNAL_JWT_MAX_TTL_SECONDS=90
GEMINI_API_KEY=<provider-key>
AI_STRUCTURED_MODEL=gemini-2.5-flash-lite
AI_TEXT_MODEL=gemini-2.5-flash
```

Không tái sử dụng `JWT_ACCESS_SECRET` người dùng cho `AI_INTERNAL_JWT_SECRET`.

### 6.3 Lệnh kiểm tra local

Tại repo `upnext-ai` (Python 3.12):

```powershell
Copy-Item .env.example .env   # chỉ lần đầu; điền secret/key cục bộ
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python -m pytest
ruff check .
ruff format --check .
pyright
python scripts/export_contracts.py --check
fastapi dev app/main.py
```

Khi test browser, chỉ coi capability hoạt động sau khi request trả lời hợp lệ, tool result đúng quyền, retry/fallback có UX tốt và không có dữ liệu riêng tư trong console/log.

## 7. Staging VPS: trạng thái và quy trình an toàn

### 7.1 Bối cảnh VPS

- Thư mục deploy: `/opt/upnext`.
- Staging backend: `upnext-backend-staging`, bind loopback `127.0.0.1:4100 -> 4000`.
- Staging frontend: `upnext-frontend-staging`, bind loopback `127.0.0.1:3100 -> 3000`.
- Staging AI: `upnext-ai-staging`, private, không host port.
- VPS còn container production và monitoring không thuộc rollout này. Không dùng `--remove-orphans`.

### 7.2 File env cần có

| File                                  | Mục đích                                                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/opt/upnext/env/deploy.env`          | interpolation image/registry: `GITHUB_OWNER`, `GHCR_USERNAME`, `GHCR_TOKEN` và các biến deploy khác. Giá trị phải là shell value hợp lệ, không để placeholder dạng `<...>`. |
| `/opt/upnext/env/backend.staging.env` | cờ/cấu hình backend gọi AI staging.                                                                                                                                         |
| `/opt/upnext/env/ai.staging.env`      | internal JWT shared, `AI_ENVIRONMENT=staging`, Gemini key/model/timeout.                                                                                                    |

`GHCR_TOKEN` chỉ cần `read:packages` để pull image private. Nếu repo image public vẫn có thể pull không login, nhưng giữ registry credential là hợp lý cho private images khác. Không commit ba file này.

### 7.3 Preflight trước deploy

```bash
cd /opt/upnext

# Đọc trạng thái trước; không pull nếu diff chứa sửa đổi chưa hiểu.
git status --short
git fetch --prune origin

# Chỉ khi worktree sạch hoặc bạn đã backup/stash có chủ đích:
git pull --ff-only origin main

# Phải source thành công; placeholder <...> sẽ làm shell lỗi.
set -a
source env/deploy.env
set +a

# Validate interpolation trước khi tạo/recreate bất kỳ container nào.
AI_STAGING_ENV_FILE=../env/ai.staging.env COMPOSE_PROFILES=ai \
docker compose -p upnext -f compose/docker-compose.staging.yml config >/dev/null
```

### 7.4 Rollout AI riêng, không phá staging khác

```bash
cd /opt/upnext
set -a; source env/deploy.env; set +a

AI_STAGING_ENV_FILE=../env/ai.staging.env COMPOSE_PROFILES=ai \
docker compose -p upnext -f compose/docker-compose.staging.yml pull ai-staging

AI_STAGING_ENV_FILE=../env/ai.staging.env COMPOSE_PROFILES=ai \
docker compose -p upnext -f compose/docker-compose.staging.yml up -d --no-deps ai-staging

docker inspect --format '{{.State.Status}} / {{if .State.Health}}{{.State.Health.Status}}{{end}}' upnext-ai-staging
docker logs --tail 100 upnext-ai-staging
```

Sau khi BE image/config mới cần rollout backend riêng:

```bash
AI_STAGING_ENV_FILE=../env/ai.staging.env COMPOSE_PROFILES=ai \
docker compose -p upnext -f compose/docker-compose.staging.yml pull backend-staging

AI_STAGING_ENV_FILE=../env/ai.staging.env COMPOSE_PROFILES=ai \
docker compose -p upnext -f compose/docker-compose.staging.yml up -d --no-deps --force-recreate backend-staging
```

Không tự `docker network connect` trừ khi audit xác minh rõ Compose network bị lệch. Nếu tái tạo đúng với `-p upnext`, cả hai phải ở `upnext_upnext-staging`.

### 7.5 Kiểm tra sau deploy

```bash
curl --fail http://127.0.0.1:4100/health

docker exec upnext-backend-staging node -e \
"fetch('http://ai-staging:8000/health/live').then(async r => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1) }).catch(e => { console.error(e); process.exit(1) })"

docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' upnext-ai-staging
docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' upnext-backend-staging
```

Sau đó mới thực hiện test thật qua API backend/UI. Không tự tạo JWT thủ công trong hướng dẫn bình thường; ưu tiên endpoint/harness đã có trong backend để kiểm tra đúng signer, scopes và business context.

## 8. Quy trình xử lý lỗi `AI_INVALID_OUTPUT` trên staging

> Nguyên nhân gốc của sự cố tháng 8/2026 đã tìm ra và sửa — đọc mục 4.1 trước khi dùng quy trình
> dưới đây. Quy trình vẫn giữ lại vì hữu ích cho lần sau, nhưng đừng lặp lại giả định cũ rằng
> `AI_INVALID_OUTPUT` nghĩa là lỗi schema: nó từng là geo-block, sai `api_version`, và thiếu
> dependency streaming.

1. Xác minh image digest/container đang chạy, không chỉ tag `develop`:

```bash
docker inspect --format '{{.Image}}' upnext-ai-staging
docker image inspect ghcr.io/binhphanbp/upnext-ai:develop --format '{{index .RepoDigests 0}}'
```

2. Xác minh AI/BE dùng cùng internal secret bằng fingerprint, không in secret:

```bash
docker exec upnext-backend-staging sh -lc 'printf %s "$AI_INTERNAL_JWT_SECRET" | sha256sum'
docker exec upnext-ai-staging sh -lc 'printf %s "$AI_INTERNAL_JWT_SECRET" | sha256sum'
```

3. Đọc log quanh đúng thời điểm một request thất bại. Chỉ ghi mã lỗi provider/model/schema; không copy prompt hoặc profile/CV vào nơi công khai.

```bash
docker logs --since 5m upnext-ai-staging | tail -n 150
docker logs --since 5m upnext-backend-staging | tail -n 150
```

4. Đối chiếu code image với commit normalizer Gemini đã merge. Nếu image thiếu commit, publish/redeploy đúng image trước khi sửa thêm.
5. Nếu provider trả 400 sau image mới:
   - log redacted phải có `provider status`, model và loại schema request;
   - chạy integration test nhỏ có response schema tương tự candidate copilot;
   - kiểm tra model có hỗ trợ structured output/JSON schema đang dùng;
   - chỉ fallback khi fallback có cùng contract và được telemetry rõ ràng.
6. Chỉ đóng incident sau khi một request Copilot thật trên staging nhận câu trả lời hợp lệ, một tool call có scope/RBAC đúng, và lỗi provider được hiển thị thân thiện khi cố ý làm hỏng provider.

## 9. Database và migration gates

Trước bất kỳ deploy backend nào liên quan pgvector:

```bash
cd /opt/upnext
mkdir -p backups
docker exec upnext-postgres-staging sh -lc \
'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
> "backups/upnext-staging-before-<change>-$(date -u +%Y%m%dT%H%M%SZ).dump"

ls -lh backups/upnext-staging-before-<change>-*.dump
```

Sau đó dùng container/backend image đúng phiên bản để chạy hoặc xem `prisma migrate status`. Nếu status không sạch:

- Dừng rollout.
- Đọc migration SQL và bảng `_prisma_migrations`.
- Chỉ dùng `prisma migrate resolve` sau khi đối chiếu schema/database và có backup hợp lệ.
- Không rollback/resolve migration khác tên chỉ để vượt P3009/P3012.

## 10. Kế hoạch triển khai tiếp theo

### Giai đoạn A — ổn định nền tảng (P0)

> Các mục của bản 15/08 (sửa CI JD generation, tái hiện `AI_INVALID_OUTPUT`, kiểm tra image
> pipeline) đã hoàn tất. Việc còn lại của giai đoạn này chỉ còn một thứ, và nó chặn tất cả:

1. **Gỡ chặn địa lý Gemini trên VPS.** Chừng nào chưa gỡ thì không thể xác minh bất kỳ capability
   nào trên staging — cả đường `upnext-ai` lẫn đường Gemini trực tiếp đều xuất phát từ cùng IP đó,
   nên fallback cũng không cứu được. Hướng rẻ nhất: đặt `HTTPS_PROXY` trong `ai.staging.env`
   (`google-genai` dùng httpx với `trust_env=True`, không cần sửa code). Hướng bền hơn: bật billing
   hoặc chuyển sang Vertex AI.
2. Sau khi gỡ: bật nốt ba cờ provider còn thiếu ở `backend.staging.env` (mục 4.2), rồi chạy đủ
   smoke checklist ở mục 11 cho cả 7 capability trước khi mở canary rộng hơn.

### Giai đoạn B — canary theo capability (P1)

Mỗi capability phải có riêng:

- feature flag, default off hoặc fallback an toàn;
- timeout, retry policy, rate limit/concurrency limit;
- contract version + schema validation ở AI và BE;
- metrics: request count, latency p50/p95, failure by code, fallback rate, token/cost where available;
- audit metadata không chứa prompt/CV thô;
- test authorization, malformed output, timeout, provider 4xx/5xx, fallback and rollback;
- acceptance criteria trước khi tăng traffic.

Thứ tự khuyến nghị: Copilot ổn định → CV screening parity → embeddings retrieval → JD extraction → JD generation → salary research/company scans.

### Giai đoạn C — hoàn thiện vận hành (P2)

- Pin image staging theo digest/release tag thay vì phụ thuộc mãi vào mutable `develop`.
- Cập nhật `README`/runbook AI vì tài liệu cũ chỉ mô tả `llm:invoke`, trong khi các route hiện có thêm scope embedding/extraction/job-post generation.
- Thiết lập eval dataset đã de-identify cho Vietnamese/English, regression tests cho tool selection và structured outputs.
- Quy định retention/audit/consent cho CV và dữ liệu hồ sơ; giới hạn logging/OTEL không mang prompt metadata.
- Dashboard/alert về provider 400/429/5xx, invalid output, queue duration và fallback rate.

## 11. Definition of Done (không được bỏ qua)

Một capability AI chỉ được gọi là hoàn thiện khi đạt tất cả:

- [ ] Unit + contract + integration tests xanh.
- [ ] Runtimes lint/format/typecheck/build xanh ở repo liên quan.
- [ ] Không có public port hoặc Nginx route vào AI service.
- [ ] Chỉ backend hợp lệ, đúng environment/scope mới gọi được private route.
- [ ] Provider success và provider failure đều có UX/telemetry rõ ràng, không lộ dữ liệu nhạy cảm.
- [ ] Fallback, timeout và rollback flag đã được test.
- [ ] Browser E2E staging thực hiện được ít nhất một happy path thật.
- [ ] Migration status sạch, backup DB được ghi nhận nếu rollout chạm schema/data.
- [ ] Không có thay đổi ngoài phạm vi bị commit nhầm từ worktree bẩn.

## 12. Checklist 30 phút đầu cho Agent tiếp theo

1. Đọc file này, xác nhận phạm vi task với người dùng.
2. Kiểm tra `git status --short` của cả bốn repo; bảo toàn mọi thay đổi có sẵn.
3. `git fetch --prune` và tạo worktree/branch sạch từ `origin/develop` (FE/AI) hoặc `origin/dev` (BE) theo repo.
4. Lập inventory chính xác những direct Gemini adapter/call-site còn lại ở `origin/dev` trước khi đề xuất migration mới.
5. Nếu xử lý JD generation, sửa CI format trước rồi chạy quality suite đầy đủ.
6. Nếu xử lý staging Copilot, xác minh image digest + provider 400 root cause trước; không suy đoán từ health check.
7. Không thay đổi VPS nếu chưa có backup/migration status khi thao tác liên quan database.

## 13. Ghi chú về dữ liệu và UX

- Khi AI thất bại, thông báo UI cần cho biết hành động kế tiếp (thử lại, dùng chức năng không AI, hoặc liên hệ hỗ trợ), không đổ lỗi kỹ thuật mơ hồ.
- Copilot không được tự nộp đơn, tự sửa CV, tự gửi mail hay tự thay đổi dữ liệu. Các hành động thay đổi trạng thái phải có xác nhận người dùng và do BE thực hiện.
- Kết quả AI là gợi ý, không phải quyết định tuyển dụng. Luôn giữ thông điệp kiểm chứng thông tin trước khi ra quyết định.
- CV/hồ sơ chỉ gửi phần context tối thiểu cần thiết cho từng request; không truyền toàn bộ lịch sử hoặc file nếu không cần.

---

### Phụ lục: lịch sử PR/nhánh cần biết

- Infra PR #1: private AI staging service.
- BE PR #133: private AI gateway foundation.
- AI PR #2: Candidate Copilot production hardening.
- AI PR #3: structured model tiers.
- AI PR #4 + BE PR #143: CV screening migration.
- AI PR #5 + BE PR #144: embeddings migration.
- AI PR #6 + BE PR #145: JD extraction migration.
- BE PR #146/#147 đã xuất hiện sau đó trên `origin/dev`; luôn đối chiếu branch hiện tại.
- AI PR #8 + BE PR #148: JD generation (đã sửa CI ruff line-length, đã merge).
- AI PR #9: tách `AI_PROVIDER_REGION_BLOCKED` khỏi lỗi chung.
- AI PR #10: pin client sang `api_version="v1beta"` để JSON mode hoạt động.
- AI PR #11: pin `aiohttp` cho async streaming của `google-genai`.
- AI PR #12 + BE PR #149: quét giấy phép kinh doanh, scope `company-license:extract`.
- AI PR #13 + BE PR #150: salary research qua capability grounded, scope `research:grounded`.
  BE đổi tên `GeminiSalaryResearchService` → `SalaryResearchService` vì class không còn gọi Gemini.
- FE PR #243: đưa tài liệu bàn giao này lên `develop`.
