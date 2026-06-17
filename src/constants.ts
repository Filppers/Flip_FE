export const FUNNEL_STEP_KEYS = [
  "예산_범위",
  "여행지_입력",
  "여행할_달",
  "여행_기간",
  "여행_구성원",
  "예산_집중_포인트",
  "숙박_스타일",
  "장소_선호",
  "음식_패턴",
  "하루_리듬",
  "추가_요청사항",
] as const;

export type FunnelStepKey = (typeof FUNNEL_STEP_KEYS)[number];

// 각 단계 헤더: heading(줄바꿈 \n 허용)에서 accent 부분만 파란색으로 강조,
// hint는 헤더 아래 작은 안내 문구(옵션)
export const STEP_META: Record<
  FunnelStepKey,
  { heading: string; accent?: string; hint?: string }
> = {
  예산_범위: {
    heading: "이번 여행의\n예산을\n설정해주세요",
    accent: "예산",
  },
  여행지_입력: {
    heading: "떠나고 싶은\n여행지를\n선택해주세요",
    accent: "여행지",
  },
  여행할_달: {
    heading: "여행하고 싶은\n달을\n선택해주세요",
    accent: "달",
    hint: "중복 선택이 가능해요",
  },
  여행_기간: {
    heading: "원하는\n여행 기간을\n선택해주세요",
    accent: "여행 기간",
  },
  여행_구성원: {
    heading: "누구와 함께\n떠나시나요?",
    accent: "누구와 함께",
    hint: "예) 20대 친구와 둘이 · 아이 동반 3인 가족 · 60대 부모님과 효도 여행",
  },
  예산_집중_포인트: {
    heading: "예산을 가장\n투자하고 싶은 곳은\n어디인가요?",
    accent: "투자하고 싶은 곳",
    hint: "최대 2개까지 선택할 수 있어요",
  },
  숙박_스타일: {
    heading: "어떤 분위기의\n숙소를 선호하세요?",
    accent: "숙소",
  },
  장소_선호: {
    heading: "어떤 장소에 있을 때\n가장 행복하세요?",
    accent: "장소",
  },
  음식_패턴: {
    heading: "현지에서 식사는\n어떻게 하고 싶으세요?",
    accent: "식사",
  },
  하루_리듬: {
    heading: "여행 중 하루는\n어떻게 보내고 싶으세요?",
    accent: "하루",
  },
  추가_요청사항: {
    heading: "추가로 고려할 점이\n있다면 적어주세요",
    accent: "고려할 점",
  },
};

export const 여행지_목록: { region: string; destinations: string[] }[] = [
  {
    region: "동아시아",
    destinations: ["대한민국", "일본", "홍콩", "상하이", "마카오", "타이베이"],
  },
  {
    region: "동남아시아",
    destinations: ["나트랑", "다낭", "세부", "마닐라", "방콕", "발리", "싱가포르", "푸켓", "하노이"],
  },
  {
    region: "미주",
    destinations: ["LA", "뉴욕", "하와이", "밴쿠버", "샌프란시스코", "칸쿤"],
  },
  {
    region: "유럽",
    destinations: ["파리", "런던", "로마", "바르셀로나", "프라하", "스위스", "산토리니", "이스탄불"],
  },
  {
    region: "오세아니아",
    destinations: ["시드니", "멜버른", "괌", "사이판", "뉴질랜드"],
  },
];

// 기본 선택형 단계(라벨만 있는 단순 버튼). 여행할 달·여행 기간.
export const 기본_선택_옵션: Record<string, string[]> = {
  여행할_달: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  여행_기간: [
    "당일치기(1박2일 미만)",
    "1박2일",
    "2박3일",
    "3박4일",
    "4박5일",
    "5박 이상",
  ],
};

// 취향/예산 분배 전략 단계 (6~10단계).
// 각 단계는 라벨 + 한 줄 설명을 가진 카드 옵션으로 구성된다.
export interface PreferenceOption {
  label: string;
  description: string;
}

export interface PreferenceStep {
  multiSelect: boolean;
  max?: number; // multiSelect일 때 최대 선택 개수
  options: PreferenceOption[];
}

export const 취향_옵션: Record<string, PreferenceStep> = {
  예산_집중_포인트: {
    multiSelect: true,
    max: 2,
    options: [
      { label: "잠자리(숙소)", description: "잠은 무조건 편하고 좋은 곳에서" },
      { label: "미식(맛집)", description: "맛있는 음식을 위해서라면 줄 서도 좋아" },
      {
        label: "경험(액티비티)",
        description: "여기서만 할 수 있는 체험과 입장료에 투자",
      },
      { label: "쇼핑", description: "브랜드 쇼핑이나 기념품 구매가 중요해" },
      { label: "가성비", description: "최대한 아껴서 더 오래 여행하고 싶어" },
    ],
  },
  숙박_스타일: {
    multiSelect: false,
    options: [
      { label: "럭셔리", description: "5성급 호텔, 고급 리조트" },
      { label: "감성", description: "에어비앤비, 유니크한 부티크 호텔" },
      { label: "실속", description: "위치 좋고 깔끔한 비즈니스 호텔" },
      { label: "로컬", description: "게스트하우스, 민박, 현지 느낌 물씬 나는 곳" },
    ],
  },
  장소_선호: {
    multiSelect: false,
    options: [
      {
        label: "인스타그램 핫플",
        description: "사진 예쁘게 나오는 힙한 카페와 전시장",
      },
      { label: "클래식 코스", description: "누구나 가는 랜드마크와 역사적 명소" },
      {
        label: "나만 아는 구석",
        description: "관광객 없는 조용한 골목과 숨은 명소",
      },
      { label: "대자연", description: "도시를 벗어난 웅장한 자연경관" },
    ],
  },
  음식_패턴: {
    multiSelect: false,
    options: [
      { label: "미식가형", description: "파인다이닝이나 오마카세 예약 필수" },
      {
        label: "로컬 체험형",
        description: "시장 음식, 길거리 음식, 현지 노포 맛집",
      },
      {
        label: "안정 추구형",
        description: "실패 없는 대형 프랜차이즈나 한식 포함",
      },
      { label: "간편형", description: "끼니는 대충 떼우고 관광에 더 집중" },
    ],
  },
  하루_리듬: {
    multiSelect: false,
    options: [
      {
        label: "얼리버드",
        description: "조식 먹고 아침 일찍 시작하는 부지런한 일정",
      },
      {
        label: "올빼미",
        description: "늦잠 자고 일어나 밤 문화를 즐기는 야행성 일정",
      },
      { label: "여유형", description: "중간에 카페에서 멍 때리는 시간이 필요한 일정" },
    ],
  },
};

// 취향 옵션이 있는(=카드 선택형) 단계 키 목록
export const 취향_단계_키 = Object.keys(취향_옵션);

// 구글 소셜 로그인 URL (index·login 공용 — 중복 정의 방지)
export const GOOGLE_SOCIAL_LOGIN_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}&response_type=code&scope=email profile`;
