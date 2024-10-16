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
        isSelected ? "bg-[#ff6f3f28] text-[#EB5A2A] font-[700]" : "bg-[#F3F4F6]"
      }  text-[15px] w-fit min-w-[38px] font-medium rounded-full py-[5px] px-[10px] whitespace-nowrap  shadow-sm  hover:bg-[#ff6f3f28] hover:text-[#EB5A2A] hover:font-bold`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default Button;
