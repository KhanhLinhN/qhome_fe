"use client";
import checkboxChecked from "@/assets/change-group/checkbox-checked.svg";
import checkbox from "@/assets/change-group/checkbox.svg";
import Image from "next/image";

interface SelectAllHeaderProps {
  isSelectAll: boolean;
  onToggleSelectAll: () => void;
  taskCount: number;
  taskSelected: number;
}

const SelectAllHeader = ({
  isSelectAll,
  onToggleSelectAll,
  taskCount,
  taskSelected,
}: SelectAllHeaderProps) => {
  return (
    <div
      className="flex flex-row items-center gap-x-2 p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
      onClick={onToggleSelectAll}
    >
      <Image
        src={isSelectAll ? checkboxChecked : checkbox}
        alt="checkbox"
        width={28}
        height={28}
        className="cursor-pointer"
      />
      <div className="font-normal text-sm text-primary-2">
        {taskSelected > 0
          ? `${taskSelected} / ${taskCount} 選択中`
          : `全 ${taskCount} 件`}
      </div>
    </div>
  );
};

export default SelectAllHeader;

