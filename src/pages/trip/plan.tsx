import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { IconSpinner } from "../../../public/icons";
import {
  사용자_취향_입력,
  FUNNEL_STEP_KEYS,
  STEP_TITLES,
} from "@/constants";
import ProgressBar from "@/components/ProgressBar";
import FunnelOptionList from "@/components/FunnelOptionList";
import DestinationSelect from "@/components/DestinationSelect";
import BudgetInput from "@/components/BudgetInput";
import TripRouteMap from "@/components/TripRouteMap";
import TripTimeline, {
  formatKRW,
  type ParsedContent,
  type ParsedDay,
} from "@/components/TripTimeline";

const TOTAL_STEPS = FUNNEL_STEP_KEYS.length;

type Phase = "funnel" | "loading-themes" | "select-theme" | "loading-plan" | "result";

// GPT 응답에서 JSON 본문만 추출 (코드펜스/앞뒤 설명 텍스트 제거)
const extractJson = (text: string): string | null => {
  const noFence = text.replace(/```json\s*|```/gi, "");
  const start = noFence.indexOf("{");
  const end = noFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return noFence.slice(start, end + 1);
};

// 스마트 따옴표 → 일반 따옴표
const normalizeQuotes = (s: string): string =>
  s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

// GPT가 섞어 보내는 작은따옴표 키/값을 큰따옴표로 정규화하고
// trailing comma를 제거한다. 문자열 내부 따옴표는 보존/이스케이프하므로
// "rateSummary": "'맛집'" 같은 정상 값이 깨지지 않는다.
const toStrictJson = (input: string): string => {
  const s = normalizeQuotes(input);
  let out = "";
  let inStr = false;
  let quote = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === "\\" && i + 1 < s.length) {
        out += ch + s[i + 1];
        i++;
        continue;
      }
      if (ch === quote) {
        out += '"';
        inStr = false;
        continue;
      }
      // 큰따옴표로 감싸므로 내부 리터럴 " 는 이스케이프
      out += ch === '"' ? '\\"' : ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      out += '"';
      continue;
    }
    if (ch === ",") {
      // 뒤 공백을 건너뛰어 } 또는 ] 면 trailing comma → 버림
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      if (s[j] === "}" || s[j] === "]") continue;
    }
    out += ch;
  }
  return out;
};

// 1차: 그대로 파싱 → 실패 시 정규화 후 재시도. 둘 다 실패하면 null
const parseLooseJson = (raw: string): any | null => {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(toStrictJson(raw));
    } catch {
      return null;
    }
  }
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("funnel");
  const [themes, setThemes] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [gptPlan, setGptPlan] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [budget, setBudget] = useState(50); // 50만원 (기본값)
  const [userPreferenceString, setUserPreferenceString] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [pickedThemeIdx, setPickedThemeIdx] = useState(0);
  const [customRequest, setCustomRequest] = useState("");

  const [userOptions, setUserOptions] = useState<
    Record<string, string[]>
  >({
    여행할_달: [],
    여행_기간: [],
    여행_인원_연령대: [],
    여행_스타일: [],
    여행_동반자: [],
    음식_취향: [],
    여행의_목적: [],
    선호하는_여행_시간대: [],
    활동_강도: [],
    쇼핑_시간: [],
    관광지_밀집도: [],
    여행_템포: [],
  });

  const buildPreferenceString = () => {
    const userOptionSelection = Object.keys(사용자_취향_입력)
      .filter(
        (key) => userOptions[key as keyof typeof 사용자_취향_입력]?.length > 0
      )
      .map(
        (key) => key + " : " + userOptions[key as keyof typeof 사용자_취향_입력]
      );

    return (
      `예산: ${budget}만원\n` +
      `여행지: ${selectedDestinations.join(", ")}\n` +
      userOptionSelection.join("\n") +
      (customRequest.trim()
        ? `\n추가 요청사항: ${customRequest.trim()}`
        : "")
    );
  };

  // 1차: 여행 테마 3개 추천 (step: "summary")
  const fetchThemes = async () => {
    const prefString = buildPreferenceString();
    setUserPreferenceString(prefString);
    setPhase("loading-themes");

    const res = await axios.post("/api/chat", {
      step: "summary",
      prompt: prefString,
    });

    try {
      const jsonStr = extractJson(res.data.response);
      const parsed = jsonStr ? parseLooseJson(jsonStr) : null;
      const summaries: string[] = parsed?.trip_summary || [];
      setThemes(summaries.length > 0 ? summaries : [res.data.response]);
    } catch {
      setThemes([res.data.response]);
    }
    setPickedThemeIdx(0);
    setPhase("select-theme");
  };

  // 2차: 선택한 테마로 상세 여행 계획 생성 (step: "details")
  const fetchPlan = async (theme: string) => {
    setSelectedTheme(theme);
    setPhase("loading-plan");

    const step2Input = JSON.stringify({
      선택한_계획: theme,
      여행지: selectedDestinations.join(", "),
      예산: `${budget}만원`,
      ...Object.fromEntries(
        Object.entries(userOptions).filter(([, v]) => v.length > 0).map(([k, v]) => [k, v.join(", ")])
      ),
    });

    const res = await axios.post("/api/chat", {
      step: "details",
      prompt: step2Input,
    });

    setGptPlan(res.data.response);
    setPhase("result");
  };

  useEffect(() => {
    const user_name = Cookies.get("user_name");
    user_name ? setUserName(user_name) : setUserName("00");
  }, []);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      fetchThemes();
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      fetchThemes();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleToggleOption = (optionKey: string, item: string) => {
    setUserOptions((prev) => ({
      ...prev,
      [optionKey]: prev[optionKey]?.includes(item)
        ? prev[optionKey].filter((el) => el !== item)
        : [...(prev[optionKey] || []), item],
    }));
  };

  const currentStepKey = FUNNEL_STEP_KEYS[currentStep];
  const stepInfo = STEP_TITLES[currentStepKey];

  // "25,000원", "25000", 25000 등 다양한 형태를 원 단위 정수로 변환
  const parseCost = (raw: unknown): number | undefined => {
    if (raw == null) return undefined;
    if (typeof raw === "number") return isNaN(raw) ? undefined : raw;
    const digits = String(raw).replace(/[^0-9]/g, "");
    return digits ? Number(digits) : undefined;
  };

  const parseCoordinate = (
    raw: unknown
  ): { lat: number; lng: number } | undefined => {
    if (!raw) return undefined;
    const parts = String(raw)
      .split(",")
      .map((s) => parseFloat(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return undefined;
  };

  // GPT 응답을 일자별 구조로 파싱 (hook은 early return 전에 호출)
  const parsedPlan: ParsedDay[] = useMemo(() => {
    if (!gptPlan) return [];
    try {
      const jsonStr = extractJson(gptPlan);
      if (!jsonStr) return [];
      const parsed = parseLooseJson(jsonStr);
      if (!parsed) return [];

      // 여러 가능한 키 대응
      const planList =
        parsed.trip_plan ||
        parsed.tripPlanList ||
        parsed.data?.tripPlanList ||
        parsed.data?.trip_plan ||
        [];

      return (planList as any[]).map((dayItem, di) => {
        const contents: ParsedContent[] = (dayItem.contents || []).map(
          (item: any) => {
            const place = item.place || {};
            const coord = parseCoordinate(place.coordinate ?? item.coordinate);
            const distance = place.distance || {};
            return {
              time: item.time,
              content: item.content || place.description || "장소",
              cost: parseCost(item.cost ?? place.cost),
              place: {
                rate: place.rate,
                rateCount: place.rate_count ?? place.rateCount,
                rateSummary: place.rate_summary ?? place.rateSummary,
                description: place.description,
                address: place.address,
                lat: coord?.lat,
                lng: coord?.lng,
                distanceKm: distance.km,
                distanceTime: distance.time,
              },
            };
          }
        );
        return {
          day: Number(dayItem.day) || di + 1,
          summary: dayItem.summary,
          contents,
        };
      });
    } catch (e) {
      console.error("여행 계획 파싱 실패:", e);
      return [];
    }
  }, [gptPlan]);

  // 새 계획이 만들어지면 첫 번째 일자를 선택
  useEffect(() => {
    if (parsedPlan.length > 0) setSelectedDay(parsedPlan[0].day);
  }, [parsedPlan]);

  const selectedDayPlan = useMemo(
    () =>
      parsedPlan.find((d) => d.day === selectedDay) ?? parsedPlan[0] ?? null,
    [parsedPlan, selectedDay]
  );

  // 선택된 일자의 방문지 좌표 (지도 마커 · 경로용)
  const dayCoordinates = useMemo(() => {
    if (!selectedDayPlan) return [];
    return selectedDayPlan.contents
      .filter((c) => c.place?.lat != null && c.place?.lng != null)
      .map((c) => ({
        lat: c.place!.lat as number,
        lng: c.place!.lng as number,
        label: c.content,
        day: selectedDayPlan.day,
      }));
  }, [selectedDayPlan]);

  // 전체 여행 예상 예산 (모든 일자 · 모든 활동 비용 합계)
  const totalEstimatedCost = useMemo(
    () =>
      parsedPlan.reduce(
        (sum, d) =>
          sum + d.contents.reduce((s, c) => s + (c.cost ?? 0), 0),
        0
      ),
    [parsedPlan]
  );

  // 선택된 일자의 예상 예산 합계
  const selectedDayTotal = useMemo(
    () =>
      selectedDayPlan
        ? selectedDayPlan.contents.reduce((s, c) => s + (c.cost ?? 0), 0)
        : 0,
    [selectedDayPlan]
  );

  const budgetWon = budget * 10000; // 만원 → 원
  const isOverBudget = totalEstimatedCost > budgetWon;
  const budgetPercent =
    budgetWon > 0
      ? Math.min(100, Math.round((totalEstimatedCost / budgetWon) * 100))
      : 0;

  // 1차 로딩: 테마 추천 중
  if (phase === "loading-themes") {
    return (
      <div className="w-[400px] h-[100vh] flex flex-col justify-center items-center gap-[20px]">
        <IconSpinner />
        <p className="font-extrabold text-[22px] text-center mt-[20px]">
          <span className="text-primary">플립 AI</span>가 {userName}님에게 맞는
          <br />
          여행 테마를 추천하고 있어요
        </p>
        <p className="font-semibold text-[#7c7c7c]">
          * 최대 2-3분 소요될 수 있어요 (평균 10초 내외 소요)
        </p>
      </div>
    );
  }

  // 테마 선택 화면
  if (phase === "select-theme") {
    return (
      <main className="flex justify-center w-[400px] h-[100vh]">
        <div className="w-full flex flex-col h-full bg-[#F2F3F5]">
          {/* 뒤로 */}
          <div className="flex-shrink-0 px-[20px] pt-[16px]">
            <button
              onClick={() => setPhase("funnel")}
              className="text-[#374151]"
              aria-label="뒤로"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          {/* 스크롤 영역 */}
          <div className="flex-1 overflow-y-auto px-[20px] min-h-0">
            <h1 className="text-center font-extrabold text-[25px] leading-[1.35] text-[#1F2937] mt-[20px]">
              {userName}님을 위한 여행 플랜이
              <br />
              완성되었어요 ! 🎉
            </h1>

            <div className="bg-white rounded-[24px] p-[20px] mt-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
              <p className="text-center text-[14px] font-bold text-[#007aff]">
                완성된 여행 플랜 {themes.length}개
              </p>

              <div className="flex flex-col gap-[12px] mt-[16px]">
                {themes.map((theme, idx) => {
                  const isPicked = idx === pickedThemeIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setPickedThemeIdx(idx)}
                      aria-pressed={isPicked}
                      className={`w-full text-left rounded-[16px] p-[18px] flex items-center gap-[14px] border-[2px] transition-all duration-200 ${
                        isPicked
                          ? "bg-white border-[#cfff0b] shadow-[0_6px_18px_rgba(0,122,255,0.16)]"
                          : "bg-white border-[#ECEDF0] hover:border-[#C9D8F2]"
                      }`}
                    >
                      <p className="flex-1 font-bold text-[16px] text-[#1F2937] leading-[1.45] break-keep">
                        {theme}
                      </p>
                      <span
                        className={`flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center transition-colors ${
                          isPicked ? "bg-[#cfff0b]" : "bg-[#EEF0F2]"
                        }`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={isPicked ? "#191F28" : "#CDD1D6"}
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-[20px]" />
          </div>

          {/* 하단 고정 버튼 */}
          <div className="flex-shrink-0 px-[20px] pt-[12px] pb-[24px] bg-[#F2F3F5]">
            <button
              onClick={() => themes[pickedThemeIdx] && fetchPlan(themes[pickedThemeIdx])}
              disabled={themes.length === 0}
              className="w-full py-[16px] rounded-[16px] bg-[#007aff] text-white font-bold text-[16px] active:bg-[#0062cc] transition-colors disabled:opacity-40"
            >
              여행 플랜 선택
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 2차 로딩: 상세 일정 생성 중
  if (phase === "loading-plan") {
    return (
      <div className="w-[400px] h-[100vh] flex flex-col justify-center items-center gap-[20px]">
        <IconSpinner />
        <p className="font-extrabold text-[22px] text-center mt-[20px]">
          <span className="text-primary">플립 AI</span>가 {userName}님의 맞춤형
          <br />
          여행 계획을 생성하고 있어요
        </p>
        {selectedTheme && (
          <p className="text-[#007aff] font-semibold text-[16px]">
            &ldquo;{selectedTheme}&rdquo; 테마
          </p>
        )}
        <p className="font-semibold text-[#7c7c7c]">
          * 최대 2-3분 소요될 수 있어요 (평균 10초 내외 소요)
        </p>
      </div>
    );
  }

  // 최종 결과 화면
  if (phase === "result") {
    const hasParsedPlan = parsedPlan.length > 0;

    return (
      <main className="flex justify-center w-[400px] h-[100vh]">
        <div className="w-full flex flex-col h-full bg-[#F7F7F8]">
          {/* 헤더 */}
          <div className="flex-shrink-0 flex items-center gap-[10px] px-[16px] py-[12px] bg-white border-b border-[#F0F0F0]">
            <button
              onClick={() => setPhase("select-theme")}
              className="flex-shrink-0 text-[#374151]"
              aria-label="뒤로"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="font-extrabold text-[16px] text-[#1F2937] truncate">
                {selectedTheme || `${userName}님 맞춤 여행`}
              </p>
              {selectedDestinations.length > 0 && (
                <p className="text-[12px] text-[#9CA3AF] truncate">
                  {selectedDestinations.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* 상단: 지도 (40%) - 선택한 일자의 경로 */}
          <div className="h-[40vh] w-full relative flex-shrink-0">
            <TripRouteMap coordinates={dayCoordinates} />
            {hasParsedPlan && (
              <div className="absolute bottom-[12px] left-[12px] bg-[#191F28]/85 backdrop-blur-sm rounded-[10px] px-[12px] py-[6px] shadow-md">
                <p className="text-[13px] font-bold text-white">
                  <span className="text-[#cfff0b]">Day {selectedDay}</span> · 방문지{" "}
                  {dayCoordinates.length}곳
                </p>
              </div>
            )}
          </div>

          {hasParsedPlan ? (
            <>
              {/* 일자 탭 */}
              <div className="flex-shrink-0 bg-white border-b border-[#F0F0F0]">
                <div className="flex gap-[8px] overflow-x-auto px-[16px] py-[12px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {parsedPlan.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => setSelectedDay(d.day)}
                      className={`flex-shrink-0 px-[16px] py-[8px] rounded-full text-[14px] font-bold transition-colors ${
                        d.day === selectedDay
                          ? "bg-[#cfff0b] text-[#191F28] shadow-sm"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      Day {d.day}
                    </button>
                  ))}
                </div>
                {(selectedDayPlan?.summary || selectedDayTotal > 0) && (
                  <div className="px-[16px] pb-[12px] flex items-start justify-between gap-[10px]">
                    {selectedDayPlan?.summary && (
                      <p className="flex-1 text-[14px] text-[#374151] font-semibold leading-[1.4]">
                        {selectedDayPlan.summary}
                      </p>
                    )}
                    {selectedDayTotal > 0 && (
                      <span className="flex-shrink-0 text-[12px] font-bold text-[#6B7280] whitespace-nowrap mt-[2px]">
                        이날 예상{" "}
                        <span className="text-[#007aff]">
                          약 {formatKRW(selectedDayTotal)}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 하단: 전체 예산 요약 + 일자별 타임라인 (스크롤 영역) */}
              <div className="flex-1 overflow-y-auto">
                {/* 전체 여행 예상 예산 vs 설정 예산 */}
                {totalEstimatedCost > 0 && (
                  <div className="mx-[16px] mt-[16px] rounded-[14px] bg-white border border-[#F0F0F0] px-[14px] py-[12px] shadow-sm">
                    <div className="flex items-end justify-between">
                      <span className="text-[13px] font-bold text-[#6B7280]">
                        전체 예상 예산
                      </span>
                      <span
                        className={`text-[18px] font-extrabold ${
                          isOverBudget ? "text-[#EF4444]" : "text-[#007aff]"
                        }`}
                      >
                        약 {formatKRW(totalEstimatedCost)}
                      </span>
                    </div>

                    {/* 진행 바 */}
                    <div className="mt-[8px] h-[8px] w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? "bg-[#EF4444]" : "bg-[#007aff]"
                        }`}
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>

                    <div className="mt-[6px] flex items-center justify-between">
                      <span className="text-[12px] text-[#9CA3AF] font-medium">
                        설정 예산 {formatKRW(budgetWon)}
                      </span>
                      <span
                        className={`text-[12px] font-bold ${
                          isOverBudget ? "text-[#EF4444]" : "text-[#16A34A]"
                        }`}
                      >
                        {isOverBudget
                          ? `예산 ${formatKRW(totalEstimatedCost - budgetWon)} 초과`
                          : `예산 내 · ${formatKRW(budgetWon - totalEstimatedCost)} 여유`}
                      </span>
                    </div>
                  </div>
                )}

                {selectedDayPlan && <TripTimeline day={selectedDayPlan} />}
              </div>
            </>
          ) : (
            // 파싱 실패 시 원문 표시 (안전망)
            <div className="flex-1 overflow-y-auto bg-white p-[16px]">
              <h5 className="font-bold text-[18px] mb-[12px]">
                <span className="text-primary">{userName}님</span> 맞춤 여행계획
              </h5>
              <pre className="text-[13px] bg-[#F9FAFB] rounded-[12px] p-[14px] whitespace-pre-wrap break-words leading-[1.6]">
                {gptPlan}
              </pre>
            </div>
          )}
        </div>
      </main>
    );
  }

  // 퍼널 화면
  return (
    <main className="flex justify-center w-[400px] h-[100vh]">
      <div className="w-full flex flex-col p-[20px] h-full">
        {/* 헤더 영역 (고정) */}
        <div className="flex-shrink-0">
          <button
            onClick={handleBack}
            className={`self-start text-[24px] mb-[16px] ${
              currentStep === 0
                ? "text-[#D1D5DB] cursor-default"
                : "text-[#374151]"
            }`}
            disabled={currentStep === 0}
          >
            &lt;
          </button>

          <ProgressBar current={currentStep} total={TOTAL_STEPS} />

          <div className="mt-[32px] mb-[8px]">
            <h1 className="font-extrabold text-[26px] leading-[1.3]">
              {currentStepKey === "예산_범위" ? (
                <>
                  {stepInfo.title}
                  <br />
                  <span className="text-[#007aff]">{stepInfo.highlight}</span>을
                  <br />
                  설정해주세요
                </>
              ) : currentStepKey === "여행_스타일" ? (
                <>
                  {userName}님{stepInfo.title}
                  <br />
                  <span className="text-[#007aff]">{stepInfo.highlight}</span>을
                  <br />
                  골라주세요
                </>
              ) : currentStepKey === "추가_요청사항" ? (
                <>
                  {stepInfo.title}
                  <br />
                  <span className="text-[#007aff]">{stepInfo.highlight}</span>이
                  <br />
                  있다면 적어주세요
                </>
              ) : (
                <>
                  {stepInfo.title}
                  <br />
                  <span className="text-[#007aff]">{stepInfo.highlight}</span>
                  {currentStepKey === "여행지_입력"
                    ? "를\n선택해주세요"
                    : "을(를)\n선택해주세요"}
                </>
              )}
            </h1>
            {currentStepKey !== "예산_범위" &&
              currentStepKey !== "추가_요청사항" && (
                <p className="text-[#007aff] text-[14px] font-medium mt-[6px]">
                  중복 선택이 가능해요
                </p>
              )}
          </div>
        </div>

        {/* 옵션 영역 (내부 스크롤) */}
        <div className="flex-1 overflow-y-auto mt-[24px] mb-[20px] min-h-0">
          {currentStepKey === "예산_범위" ? (
            <BudgetInput budget={budget} onChange={setBudget} />
          ) : currentStepKey === "여행지_입력" ? (
            <DestinationSelect
              selected={selectedDestinations}
              onToggle={(dest) =>
                setSelectedDestinations((prev) =>
                  prev.includes(dest)
                    ? prev.filter((d) => d !== dest)
                    : [...prev, dest]
                )
              }
            />
          ) : currentStepKey === "추가_요청사항" ? (
            <textarea
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              placeholder="예) 아이 동반이라 유아 시설이 필요해요 / 매운 음식은 못 먹어요 / 걷는 일정은 적게 해주세요"
              className="w-full h-[200px] p-[16px] rounded-[16px] border border-[#E5E7EB] text-[15px] leading-[1.6] resize-none outline-none focus:border-[#007aff] placeholder:text-[#9CA3AF]"
            />
          ) : (
            <FunnelOptionList
              optionKey={currentStepKey as keyof typeof 사용자_취향_입력}
              selected={userOptions[currentStepKey] || []}
              onToggle={(item) => handleToggleOption(currentStepKey, item)}
            />
          )}
        </div>

        {/* 하단 버튼 (고정) */}
        <div className="flex-shrink-0 flex gap-[12px] pb-[20px]">
          <button
            onClick={handleSkip}
            className="flex-shrink-0 px-[24px] py-[14px] rounded-[16px] border-[1px] border-[#D1D5DB] text-[#6B7280] font-semibold text-[16px]"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-[14px] rounded-[16px] bg-[#007aff] text-white font-bold text-[16px] active:bg-[#0062cc] transition-colors"
          >
            {currentStep === TOTAL_STEPS - 1 ? "완료" : "다음으로"}
          </button>
        </div>
      </div>
    </main>
  );
}
