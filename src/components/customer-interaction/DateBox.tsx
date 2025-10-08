import Image from "next/image";
import CalendarIcon from '@/src/assets/CalendarIcon.svg';
interface DateBoxProps {
  dateValue: string;
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholderText?: string;
};

const DateBox = ({ dateValue, handleDateChange, placeholderText } : DateBoxProps) => { 

  return (
    <div
      className="flex items-center border border-[#38A169] rounded-lg h-10 w-full" 
    >
      <input
        type="date"
        className={`text-[#38A169] w-full flex-grow h-full bg-transparent hide-date-icon focus:ring-0 focus:outline-none pl-3 pr-2 z-10`} 
        value={dateValue} 
        onChange={handleDateChange}
        data-placeholder={placeholderText} 
      />
      <Image
        src={CalendarIcon}
        alt="CalendarIcon"
        width={20}
        height={20}
        className="text-[#38A169] shrink-0 mr-3"
      />
    </div>
  );
};

export default DateBox;
