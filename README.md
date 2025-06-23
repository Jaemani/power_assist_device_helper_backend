#### [API - Swagger](https://app.swaggerhub.com/apis/Jaemani/Soorisoori/1.0.0)
#### [API 명세서(비개발자용)](#api)
#### [MongoDB Schema 명세서](#db)

# <a name="top"></a>🛠 수리수리 마수리 – 전동보장구 수리이력 관리 시스템

<div align="center">

**2025 Kakao [Tech for Impact](https://techforimpact.io/) 참여 프로젝트**  
전동보장구 사용자의 이동권 보장을 위한  
**QR 기반 수리 이력 관리 시스템**

</div>

---
## Acknowledgement
본 프로젝트는 카카오임팩트 테크포임팩트 프로그램을 통해 개발되었습니다.
![카카오임팩트 로고](lib/kakao_impact_logo_color.png)

## 🧩 문제 정의

전동보장구(전동휠체어, 전동스쿠터 등)의 수리는  
① 종이문서, 구두 전달 위주로 이루어지고 있고  
② 수리 이력이 기관, 사용자, 수리기사 간에 공유되지 않으며  
③ 수리 내역이 축적되지 않아 반복적인 고장이 발생하고 있음.

**결과적으로 이동권 침해, 복지예산 비효율, 책임소재 불분명** 등의 문제가 발생하고 있음.

---

## 💡 해결책

**수리수리 마수리**는 다음과 같은 해결책을 제공합니다:

- QR 코드를 통해 장비 고유 식별 및 수리 이력 조회
- 사용자 / 수리기사 / 기관 관리자 각각의 관점에서 설계된 화면
- 수리 항목 체크 → 수리일자 자동기록 → 복지관 통계 연동
- 수리비 예산 산정 및 보증 여부 확인 가능

> 수리기사의 사용 편의성을 높이기 위해 **기록 부담 최소화**,  
> 사용자에게는 **직관적인 이력 확인 UI** 제공

---

## 🖥 시스템 구성도

- **사용자**: 내 장비의 QR코드를 스캔해 수리이력 조회  
- **수리기사**: QR을 스캔하여 수리 항목 체크 → 자동 저장  
- **복지관**: 전체 통계 조회 및 Excel 다운로드 기능 제공 예정  
- **장비별 이력**은 MongoDB에 저장되며, 각 역할별 권한에 따라 접근이 제한됨

---

## 🔧 사용 기술

- Frontend: Flutter Web + Firebase Hosting
- Backend: Next.js App Router + MongoDB
- Authentication: Firebase 전화번호 기반 SMS 인증
- Device Recognition: `uuidv4` 기반 QR 코드 생성
- Deploy: 자체 서버 (AWS 이전 계획)

---

## 🗓 진행 현황

- ✅ 수리 내역 입력 및 저장 기능 구현  
- ✅ QR 스캔 및 장비별 이력 확인 기능  
- ✅ 인증 및 권한 분리 구현
- ✅ 복지관과 연계하여 전동보장구 테스트 사용자 확보, QR 이미지 생성 및 스티거 제작
- 🔄 복지관 실사용 테스트 및 피드백 반영 중  
- 🔄 별따러가자 프로젝트와 연계 예정 (사고 감지 → 수리 연동)

---

## 👤 팀원 역할

| 이름 | 역할 |
|------|------|
| 박유빈 | PM |
| 박현준 | UI/UX |
| 이종준 | Frontend |
| 조성현 | Backend |
| 이재만 | Backend |

---

## 🏛 협력 기관

- 성동장애인종합복지관  
- 별따러가자

---
## 🌍 연계 파트너 – [별따러가자](https://starpickers.imweb.me/)

> **(주)별따러가자**는 AIoT 기반 모빌리티 안전 솔루션 기업으로,  
> **운전 습관 분석**, **사고 탐지 및 검증 모델**, **사회적 비용 절감**을 위한 기술을 개발 중입니다.

전동보장구, 이륜차, 농기계 등 다양한 이동수단에 부착 가능한 모션 센서를 통해  
**운전자의 안전 점수 제공, 사고 경중 판단, 도난 알림** 등의 기능을 제공합니다.

**2023~2024년 충남 예산군 시범사업에서 실사고 6건 전부 탐지**,  
사고 재확인 모델의 100% 정확도를 입증했습니다.

> 현재 수리이력 관리 시스템과 **사고 탐지 시스템 간 연계를 위한 사전 인프라 통합 중**이며,  
> **장비 고장 ↔ 사고 이력 간 상관관계 분석**까지 발전시킬 계획입니다.

---

## 🌱 향후 계획

- 수리 빈도 기반 부품 수명 예측 기능 개발  
- 사용자 대시보드 시각화  
- 복지 예산 자동 집계 기능 추가  
- 공개 API 제공 및 타 기관 확산 검토

---

<div align="center">
  
  ## 🔗 Related Resources
  
  | 📘 [Notion Project Page](https://jaeman-hyu.notion.site/1c4ec4b6449b80bca4f2d6413eb7e8ef?pvs=74) | 🧾 [Presentation PDF(중간발표)](https://github.com/user-attachments/files/20057505/-.pdf)|
  |:---:|:---:|
</div>  

---  
<br>
<br>
<br>
<br>
<br>
<br>

# <a name="api"></a>📘 API 명세서 (비개발자용) - Soorisoori 시스템

모든 API는 Firebase 로그인 이후에만 사용할 수 있습니다. 각 요청은 "사용자가 누굴까?"를 확인하기 위해 로그인 정보가 필요합니다.

---

## 🔐 1. 사용자 역할 조회

- **주소**: `/auth/role`
- **방식**: GET
- **설명**: 로그인한 사용자의 역할(role)을 알려줍니다.
- **성공 예시**:
```json
{ "role": "user" }
```
- **실패 상황**: 로그인 정보가 잘못되었거나, 사용자가 존재하지 않음

---

## 👤 2. 사용자 등록 (차량과 연결)

- **주소**: `/users/{vehicleId}`
- **방식**: POST
- **설명**: 사용자를 새로 등록하고, vehicleId에 해당되는 차량과 연결합니다.
- **필수 정보 (Body 안에 포함)**:
  - 이름(name)
  - 차량 모델명(model)
  - 구매일자(purchasedAt) → 예: "2024-01-10T00:00:00.000Z"
  - 등록일자(registeredAt)
  - 수신자 유형(recipientType) → 예: "user"
- **성공 예시**:
```json
{ "userId": "...", "name": "홍길동", "phoneNumber": "01012345678", "role": "user", "recipientType": "user", "vehicleId": "abcd-1234" }
```
- **실패 상황**:
  - 해당 차량이 존재하지 않음
  - 이미 해당 차량은 누군가가 등록함
  - 이미 사용자로 등록된 전화번호임
  - 로그인 정보가 유효하지 않음

---

## 🚘 3. 차량 정보 조회

- **주소**: `/vehicles/{vehicleId}`
- **방식**: GET
- **설명**: 차량에 연결된 사용자 정보와 기본 차량 정보를 확인합니다. vehicleId를 제외한 항목들이 비어있다면 주인없는 vehicle
- **성공 예시**:
```json
{ "userId": "사용자 ID", "vehicleId": "abcd-1234", "model": "휠체어 3000", "purchasedAt": "2024-01-10T00:00:00.000Z", "registeredAt": "2024-02-10T00:00:00.000Z" }
```
- **실패 상황**:
  - 차량 ID가 잘못됨
  - 로그인한 사람이 해당 차량의 주인이 아님

---

## 🛠️ 4. 수리 이력 조회

- **주소**: `/repairs/{vehicleId}`
- **방식**: GET
- **설명**: 차량의 모든 수리 내역을 가져옵니다. 가장 최근 수리가 먼저 나옵니다.
- **성공 예시**:
```json
[ { "repairer": "홍수리기사", "repairStationCode": "ST01", "repairStationLabel": "강남수리센터", "repairedAt": "2024-12-12T00:00:00.000Z", "billingPrice": 15000, "isAccident": false, "repairCategories": ["타이어", "기타"], "batteryVoltage": 36.5, "etcRepairParts": "배터리 교체", "memo": "비상 수리" } ]
```
- **실패 상황**:
  - 차량 ID가 잘못됨
  - 로그인한 사람이 해당 차량의 주인이 아님
  - 로그인 정보가 유효하지 않음

---

## 🛠️ 5. 수리 이력 등록

- **주소**: `/repairs/{vehicleId}`
- **방식**: POST
- **설명**: 차량의 새로운 수리 정보를 등록합니다.
- **필수 정보**:
  - 수리자 이름 (`repairer`) 
  - 수리일자 (`repairedAt`)
  - 수리비 (`billingPrice`)
  - 사고 여부 (`isAccident`: true/false)
  - 수리 항목 목록 (`repairCategories`: 예: ["타이어", "기타"])
  - 배터리 전압 (`batteryVoltage`) -- "배터리" 가 수리 항목 목록에서 선택되었을 경우
  - 기타 수리내역 -- "기타" 가 수리 항목 목록에서 선택되었을 경우
  - 메모 (`memo`, 선택)
- **성공 예시**:
```json
{ "_id": "자동생성된수리ID", ... }
```
- **실패 상황**:
  - 필수 항목이 빠졌거나 형식이 틀림
  - 수리자가 아님
  - 서버 오류

---

## 🧭 6. 수리센터 목록 조회

- **주소**: `/repair-stations`
- **방식**: GET
- **설명**: 전국 수리센터의 목록을 가져옵니다. 위치 좌표도 포함되어 있어 지도에 표시할 수 있습니다. (state: 도, city: 시, region: 구)
- **성공 예시**:
```json
{ "stations": [ { "code": "ST01", "state": "서울", "city": "서울", "region": "강남구", "address": "서울시 강남구 테헤란로 123", "label": "강남보장구수리센터", "telephone": "02-1234-5678", "coordinate": [127.12345, 37.12345] } ] }
```
- **실패 상황**:
  - 서버 오류

---

## 📌 인증 공통 사항

- 모든 API 요청은 로그인 후 발급된 토큰을 사용해야 합니다.
- 예시:  
```
Authorization: Bearer <로그인한 사용자 토큰>
```
- 브라우저에서는 자동 처리되며, 외부에서 테스트할 경우 위의 형식을 헤더에 추가합니다.

---  
<br>
<br>
<br>
<br>
<br>
<br>

# <a name="db"></a> 🗂️ MongoDB Schema 명세서

MongoDB (Mongoose) 기반 데이터 모델 설명. 각 모델은 `/lib/db/models/` 디렉토리에 정의되어 있음.

---
## 공통 Options
- `timestamps: true` createdAt, updatedAt 관리를 위함
- `versionKey: false` mongoose의 버전. package.json에서 확인 가능하므로 불필요한 field

## 1. Users

**Collection:** `users`  
**File:** `Users.js`

### Schema
| Field         | Type                     | Required | Unique | Description                          |
|---------------|--------------------------|----------|--------|--------------------------------------|
| firebaseUid   | String                   | ✅       | ✅     | Firebase UID                         |
| name          | String                   | ✅       |        | 사용자 이름                           |
| phoneNumber   | String                   | ✅       |        | 전화번호                              |
| role          | Enum(String)             | ❌       |        | ['user', 'admin', 'repairer', 'guardian'] (default: 'user') |
| recipientType | Enum(String)             | ❌       |        | ['general', 'disabled', 'lowIncome'] (default: 'general') |
| guardianIds   | [ObjectId] (ref: guardians) | ❌    |        | 보호자 관계 (N:1)                    |

---

## 2. Vehicles

**Collection:** `vehicles`  
**File:** `Vehicles.js`

### Schema
| Field         | Type                     | Required | Unique | Description                 |
|---------------|--------------------------|----------|--------|-----------------------------|
| vehicleId     | String                   | ✅       | ✅     | 차량 고유 ID               |
| userId        | ObjectId (ref: users)    | ❌       |        | 차량 소유자 ID             |
| model         | String                   | ❌       |        | 차량 모델명                |
| purchasedAt   | Date                     | ❌       |        | 구매 일자                  |
| registeredAt  | Date                     | ❌       |        | 등록 일자                  |

---

## 3. Repairs

**Collection:** `repairs`  
**File:** `Repairs.js`

### Schema
| Field              | Type                      | Required | Description                             |
|--------------------|---------------------------|----------|-----------------------------------------|
| vehicleId          | ObjectId (ref: vehicles)  | ✅       | 수리 대상 차량 ID                       |
| repairedAt       | Date                      | ✅       | 수리 날짜                               |
| billingPrice       | Number                    | ✅       | 수리 비용                               |
| isAccident         | Boolean                   | ✅       | 사고 수리 여부                          |
| repairStationCode  | String                    | ✅       | 수리센터 코드                           |
| repairStationLabel | String                    | ✅       | 수리센터 라벨 (이름)                    |
| repairer           | String                    | ❌       | 수리 기사 이름                          |
| repairCategories   | [String]                    | ✅       | 수리 항목 목록 (CSV형태 문자열)         |
| batteryVoltage     | Number                    | ❌       | 배터리 전압   - Categories에 '배터리' 포함된 경우           |
| etcRepairParts     | String                    | ❌       | 기타 수리 부품     - Categories에 '기타' 포함된 경우                  |
| memo               | String                    | ❌       | 관리자 메모                              |

---

## 4. RepairStations

**Collection:** `repairstations`  
**File:** `RepairStations.js`

### Schema
| Field         | Type                 | Required | Description                            |
|---------------|----------------------|----------|----------------------------------------|
| code          | String               | ✅       | 고유 수리센터 코드                     |
| firebaseUid   | String               | ❌       | Firebase 인증자   - 사전에 등록되지 않은 수리소에는 계정이 없기 때문에 패스                 |
| label         | String               | ✅       | 수리센터 명칭                          |
| state         | String               | ✅       | 시/도                                  |
| city          | String               | ✅       | 시/군/구                               |
| region        | String               | ✅       | 지역 (ex. 역삼동)                      |
| address       | String               | ✅       | 상세 주소                              |
| telephone     | String               | ✅       | 전화번호                                |
| coordinate    | GeoJSON Point        | ✅       | 좌표 정보 (type: 'Point', [lng, lat]) |

### Indexes
- `{ coordinate: '2dsphere' }` for geo queries

---

## 5. Guardians

**Collection:** `guardians`  
**File:** `Guardians.js`

### Schema
| Field       | Type                      | Required | Unique | Description                   |
|-------------|---------------------------|----------|--------|-------------------------------|
| firebaseUid | String                    | ✅       | ✅     | 보호자 Firebase UID           |
| userId      | ObjectId (ref: users)     | ✅       |        | 보호자가 담당하는 사용자 ID  |

---

## 🔄 관계도 (ERD 요약)

```text
Users ---< Vehicles
Users ---< Guardians
Vehicles ---< Repairs
Repairs >--- RepairStations (code/label only, not ObjectId)
```

- One `User` can own multiple `Vehicles`
- One `Vehicle` can have multiple `Repairs`
- One `User` can have multiple `Guardians`
- `Repairs` reference `RepairStation` via `repairStationCode`/`label` (not strict ObjectId)

---

## 📁 파일 구성 위치

```
lib/
└── db/
    ├── connect.js
    ├── models/
    │   ├── Users.js
    │   ├── Vehicles.js
    │   ├── Repairs.js
    │   ├── RepairStations.js
    │   ├── Guardians.js
    │   └── index.js
```

---



---
#### [맨 위로 이동](#top)
#### [API - Swagger](https://app.swaggerhub.com/apis/Jaemani/Soorisoori/1.0.0)
#### [API 명세서(비개발자용)](#api)
#### [MongoDB Schema 명세서](#db)
