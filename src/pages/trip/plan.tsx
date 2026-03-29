import axios from "axios";
import { useEffect, useState } from "react";
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

const TOTAL_STEPS = FUNNEL_STEP_KEYS.length;

export default function Home() {
  const [gptResponseText, setGptResponseText] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [isGPTLoading, setIsGPTLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [userOptions, setUserOptions] = useState<
    Record<string, string[]>
  >({
    여행할_달: [],
    여행_기간: [],
    여행_인원_연령대: [],
    여행_스타일: [],
    여행_동반자: [],
    음식_취향: [],
    예산_범위: [],
    여행의_목적: [],
    선호하는_여행_시간대: [],
    활동_강도: [],
    쇼핑_시간: [],
    관광지_밀집도: [],
    여행_템포: [],
  });

  const createGPTResponse = async () => {
    const userOptionSelection = Object.keys(사용자_취향_입력)
      .filter(
        (key) => userOptions[key as keyof typeof 사용자_취향_입력]?.length > 0
      )
      .map(
        (key) => key + " : " + userOptions[key as keyof typeof 사용자_취향_입력]
      );

    const userOptionSelectionString =
      `여행지: ${selectedDestinations.join(", ")} \n` + userOptionSelection.join("\n");

    setIsGPTLoading(true);

    const res = await axios.post("/api/chat", {
      prompt: userOptionSelectionString,
    });

    if (res.data.response) setIsGPTLoading(false);
    setGptResponseText(res.data.response);
  };

  useEffect(() => {
    const user_name = Cookies.get("user_name");
    user_name ? setUserName(user_name) : setUserName("00");
  }, []);

  useEffect(() => {
    if (!gptResponseText) setIsGPTLoading(false);
  }, [gptResponseText]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      createGPTResponse();
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      createGPTResponse();
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

  if (isGPTLoading) {
    return (
      <div className="w-[400px] h-[100vh] flex flex-col justify-center items-center gap-[20px]">
        <IconSpinner />
        <p className="font-extrabold text-[22px] text-center mt-[20px]">
          <span className="text-primary">플립 AI</span>가 {userName}님의 맞춤형
          여행 계획을
          <br />
          생성하고 있어요
        </p>
        <p className="font-semibold text-[#7c7c7c]">
          * 최대 2-3분 소요될 수 있어요 (평균 10초 내외 소요)
        </p>
      </div>
    );
  }

  if (gptResponseText) {
    return (
      <main className="flex justify-center w-[400px] p-[20px]">
        <section className="flex flex-col p-[10px] gap-[20px]">
          <h5 className="font-bold text-[25px]">
            <span className="text-[#eb5a2a] underline">{userName}님</span> 취향
            맞춤 <p className="underline">AI 여행계획 생성 결과 (JSON)</p>
          </h5>
          <p className="h-[700px] overflow-y-auto">{gptResponseText}</p>
        </section>
      </main>
    );
  }

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
              {currentStepKey === "여행_스타일" ? (
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
            <p className="text-[#EB5A2A] text-[14px] font-medium mt-[6px]">
              중복 선택이 가능해요
            </p>
          </div>
        </div>

        {/* 옵션 영역 (내부 스크롤) */}
        <div className="flex-1 overflow-y-auto mt-[24px] mb-[20px] min-h-0">
          {currentStepKey === "여행지_입력" ? (
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
