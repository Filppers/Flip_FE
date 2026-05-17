const Button = ({
  onClick,
  isSelected,
  text,
}: {
  onClick: () => void;
  isSelected: boolean;
  text: string;
}) => {
  return (
    <button
      className={`${
        isSelected
          ? "bg-[#007aff28] text-[#007aff] font-semibold"
          : "bg-[#F3F4F6] font-medium"
      }  text-[14px] w-fit min-w-[38px] font-medium rounded-full py-[5px] px-[10px] whitespace-nowrap  shadow-sm  hover:bg-[#007aff28] hover:text-[#007aff] hover:font-bold`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
