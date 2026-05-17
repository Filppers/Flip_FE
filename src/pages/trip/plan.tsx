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
  type ParsedContent,
  type ParsedDay,
} from "@/components/TripTimeline";

const TOTAL_STEPS = FUNNEL_STEP_KEYS.length;

type Phase = "funnel" | "loading-themes" | "select-theme" | "loading-plan" | "result";

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
      userOptionSelection.join("\n")
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
      const raw = res.data.response.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(raw);
      const summaries: string[] = parsed.trip_summary || [];
      setThemes(summaries.map((s) => s));
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
      const jsonMatch = gptPlan.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];
      const parsed = JSON.parse(jsonMatch[0]);

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
                {selectedDayPlan?.summary && (
                  <p className="px-[16px] pb-[12px] text-[14px] text-[#374151] font-semibold leading-[1.4]">
                    {selectedDayPlan.summary}
                  </p>
                )}
              </div>

              {/* 하단: 일자별 타임라인 */}
              <div className="flex-1 overflow-y-auto">
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
            {currentStepKey !== "예산_범위" && (
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
