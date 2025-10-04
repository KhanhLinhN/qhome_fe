"use client";
import DropdownArrow from '@/src/assets/DropdownArrow.svg';
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
 
interface SelectProp<T extends object> {
  options: T[];
  onSelect?: (item: T) => void;
  initialValue?: T;
  renderItem: (item: T) => string;
  filterLogic: (item: T, keyword: string) => boolean;
  placeholder?: string;
}
 
const Select = <T extends object>({ options, initialValue, onSelect, renderItem, filterLogic, placeholder }: SelectProp<T>) => {
  const [selected, setSelected] = useState<T>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>("");
 
  useEffect(() => {
    setSelected(initialValue);
  }, [initialValue]);
 
  const onOpen = () => setIsOpen(true);
 
  const onClose = () => setIsOpen(false);
 
  const filteredOptions = options.filter(
    (item: any) => filterLogic(item, keyword)
  );
 
  const onSelectItem = (item: T) => () => {
    if (typeof onSelect === "function") {
      onSelect(item);
    }
    setSelected(item);
    setKeyword("");
    onClose();
  };
 
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (divRef.current && !divRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [divRef]);
 
  return (
    <div className="relative" ref={divRef}>
      <div
        className="h-10 min-w-[130px] rounded-md border-[1px] border-[#2ad47a] px-3 py-2.5 bg-white cursor-pointer flex flex-row items-center justify-between gap-x-3"
        onClick={isOpen ? onClose : onOpen}
      >
        <div
          className={clsx(
            "font-normal text-sm text-[#81a996]",
            selected && "text-primary-2"
          )}
        >
          {selected ? renderItem(selected) : placeholder}
        </div>
        <Image
          src={DropdownArrow}
          alt="DropdownArrow"
          width={16}
          height={16}
          className={isOpen ? "rotate-180" : "rotate-0"}
        />
      </div>
      {isOpen && (
        <div className="absolute z-10 top-[50px] right-0 left-0 max-h-[300px] bg-white border-[1px] border-[#E7E7E7] p-1 rounded-md flex flex-col shadow-[0_4px_6px_1px_rgba(0,0,0,0.1)]">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full h-10 min-h-10 flex-none rounded-md border-[1px] border-[#E7E7E7] bg-white font-normal text-sm placeholder-[#81A996] text-primary-2 px-3"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="overflow-y-auto flex-1">
            {filteredOptions.map((item, index) => {
              return (
                <div
                  key={index}
                  className="mx-1 px-2 py-1.5 font-semibold text-sm text-[#02542D] cursor-pointer hover:bg-gray-100 rounded-sm"
                  onClick={onSelectItem(item)}
                >
                  {renderItem(item)}
                </div>
              );
            })}
             {filteredOptions.length === 0 && (
                 <div className="mx-1 px-2 py-1.5 text-sm text-gray-500 italic">No results found.</div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Select;
