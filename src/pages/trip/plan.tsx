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

  // GPT 응답에서 좌표 파싱 (hook은 early return 전에 호출)
  const parsedCoordinates = useMemo(() => {
    if (!gptPlan) return [];
    const coords: { lat: number; lng: number; label: string; day: number }[] = [];

    // JSON 파싱 시도
    try {
      // GPT 응답에서 JSON 부분만 추출
      const jsonMatch = gptPlan.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // 여러 가능한 키 대응
        const planList =
          parsed.trip_plan ||
          parsed.tripPlanList ||
          parsed.data?.tripPlanList ||
          parsed.data?.trip_plan ||
          [];

        planList.forEach((dayItem: any) => {
          const day = dayItem.day || 1;
          const contents = dayItem.contents || [];
          contents.forEach((item: any) => {
            const coordStr = item.place?.coordinate || item.coordinate;
            if (!coordStr) return;
            const parts = String(coordStr).split(",").map((s: string) => parseFloat(s.trim()));
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              coords.push({
                lat: parts[0],
                lng: parts[1],
                label: `Day${day} ${item.content || ""}`,
                day,
              });
            }
          });
        });
      }
    } catch (e) {
      console.error("JSON 파싱 실패, 정규식 fallback 시도:", e);
    }

    // JSON 파싱 실패 시 정규식으로 coordinate 값 직접 추출
    if (coords.length === 0) {
      const regex = /"coordinate"\s*:\s*"([^"]+)"/g;
      let match;
      let idx = 1;
      while ((match = regex.exec(gptPlan)) !== null) {
        const parts = match[1].split(",").map((s) => parseFloat(s.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          coords.push({
            lat: parts[0],
            lng: parts[1],
            label: `장소 ${idx}`,
            day: 1,
          });
          idx++;
        }
      }
    }

    return coords;
  }, [gptPlan]);

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
        <div className="w-full flex flex-col p-[20px] h-full">
          <div className="flex-shrink-0">
            <div className="mt-[32px] mb-[8px]">
              <h1 className="font-extrabold text-[26px] leading-[1.3]">
                {userName}님을 위한
                <br />
                <span className="text-[#EB5A2A]">여행 테마</span>를
                <br />
                골라주세요
              </h1>
              <p className="text-[#9CA3AF] text-[14px] font-medium mt-[6px]">
                선택한 테마로 상세 일정을 만들어 드릴게요
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-[24px] mb-[20px] min-h-0">
            <div className="flex flex-col gap-[12px]">
              {themes.map((theme, idx) => (
                <button
                  key={idx}
                  onClick={() => fetchPlan(theme)}
                  className="w-full text-left p-[20px] rounded-[16px] bg-[#F3F4F6] hover:bg-[#ff6f3f28] hover:border-[#EB5A2A] border-[2px] border-transparent transition-all duration-200"
                >
                  <p className="font-bold text-[17px] text-[#374151] leading-[1.5]">
                    {theme}
                  </p>
                </button>
              ))}
            </div>
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
          <p className="text-[#EB5A2A] font-semibold text-[16px]">
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
    return (
      <main className="flex justify-center w-[400px] h-[100vh]">
        <div className="w-full flex flex-col h-full">
          {/* 상단: 지도 (50%) */}
          <div className="h-[50vh] w-full relative">
            <TripRouteMap coordinates={parsedCoordinates} />
            {selectedTheme && (
              <div className="absolute top-[12px] left-[12px] right-[12px] bg-white/90 backdrop-blur-sm rounded-[12px] px-[14px] py-[10px] shadow-md">
                <p className="text-[#EB5A2A] font-bold text-[14px] truncate">
                  {selectedTheme}
                </p>
              </div>
            )}
          </div>

          {/* 하단: 여행 계획 JSON (50%) */}
          <div className="h-[50vh] w-full overflow-y-auto bg-white p-[16px]">
            <h5 className="font-bold text-[20px] mb-[12px]">
              <span className="text-[#eb5a2a]">{userName}님</span> 맞춤 여행계획
            </h5>
            <pre className="text-[13px] bg-[#F9FAFB] rounded-[12px] p-[14px] whitespace-pre-wrap break-words leading-[1.6]">
              {gptPlan}
            </pre>
          </div>
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
                  <span className="text-[#EB5A2A]">{stepInfo.highlight}</span>을
                  <br />
                  설정해주세요
                </>
              ) : currentStepKey === "여행_스타일" ? (
                <>
                  {userName}님{stepInfo.title}
                  <br />
                  <span className="text-[#EB5A2A]">{stepInfo.highlight}</span>을
                  <br />
                  골라주세요
                </>
              ) : (
                <>
                  {stepInfo.title}
                  <br />
                  <span className="text-[#EB5A2A]">{stepInfo.highlight}</span>
                  {currentStepKey === "여행지_입력"
                    ? "를\n선택해주세요"
                    : "을(를)\n선택해주세요"}
                </>
              )}
            </h1>
            {currentStepKey !== "예산_범위" && (
              <p className="text-[#EB5A2A] text-[14px] font-medium mt-[6px]">
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
            className="flex-1 py-[14px] rounded-[16px] bg-[#EB5A2A] text-white font-bold text-[16px]"
          >
            {currentStep === TOTAL_STEPS - 1 ? "완료" : "다음으로"}
          </button>
        </div>
      </div>
    </main>
  );
}
