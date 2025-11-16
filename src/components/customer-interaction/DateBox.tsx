import Image from "next/image";
import CalendarIcon from '@/src/assets/CalendarIcon.svg';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DateBoxProps {
    // value in dd/mm/yyyy format (or '')
    value: string;
    // emits dd/mm/yyyy (or '')
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onInvalidDate?: (value: string) => void;
    placeholderText?: string;
};

const DateBox = ({ value, onChange, onInvalidDate, placeholderText } : DateBoxProps) => { 
    const textInputRef = useRef<HTMLInputElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = useState<string>(value ?? '');

    // keep local display in sync when parent value changes externally
    useEffect(() => {
        setDisplayValue(value ?? '');
    }, [value]);

    const handleIconClick = () => {
        // seed hidden date input from current dd/mm/yyyy if valid
        const iso = ddmmyyyyToIso(value);
        if (dateInputRef.current) {
            dateInputRef.current.value = iso ?? '';
            dateInputRef.current.showPicker();
        }
    };

    const isValidDdmmyyyy = useCallback((text: string) => {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return false;
        const [dayStr, monthStr, yearStr] = text.split('/');
        const day = Number(dayStr);
        const month = Number(monthStr);
        const year = Number(yearStr);
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year &&
               date.getMonth() === month - 1 &&
               date.getDate() === day;
    }, []);

    const ddmmyyyyToIso = useCallback((text: string): string | null => {
        if (!isValidDdmmyyyy(text)) return null;
        const [dayStr, monthStr, yearStr] = text.split('/');
        const year = yearStr;
        const month = monthStr.padStart(2, '0');
        const day = dayStr.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, [isValidDdmmyyyy]);

    const isoToDdmmyyyy = useCallback((iso: string): string | null => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
        const [year, month, day] = iso.split('-');
        const d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        // Validate round-trip
        if (String(d.getUTCFullYear()) !== year ||
            String(d.getUTCMonth() + 1).padStart(2, '0') !== month ||
            String(d.getUTCDate()).padStart(2, '0') !== day) return null;
        return `${day}/${month}/${year}`;
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setDisplayValue(next);
        if (next === '') {
            // allow clearing
            onChange?.(e);
            return;
        }
        if (isValidDdmmyyyy(next)) {
            // clear any previous custom validity and propagate
            e.target.setCustomValidity('');
            onChange?.(e);
        } else {
            // set validity message and optionally notify
            e.target.setCustomValidity('Vui lòng nhập ngày hợp lệ (dd/mm/yyyy).');
            onInvalidDate?.(next);
            // do not call upstream onChange to keep controlled value stable
            // trigger native validity UI only on blur/submit; not forcing reportValidity here
        }
    }, [isValidDdmmyyyy, onChange, onInvalidDate]);

    const handleHiddenDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value; // yyyy-mm-dd
        const converted = iso ? isoToDdmmyyyy(iso) : '';
        if (converted == null) {
            onInvalidDate?.(iso);
            return;
        }
        // create a synthetic event to pass dd/mm/yyyy to upstream
        if (textInputRef.current) {
            textInputRef.current.value = converted;
        }
        setDisplayValue(converted);
        const synthetic = {
            ...e,
            target: {
                ...(textInputRef.current as HTMLInputElement),
                value: converted,
                setCustomValidity: (message: string) => (textInputRef.current as HTMLInputElement).setCustomValidity(message)
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange?.(synthetic);
    }, [isoToDdmmyyyy, onChange, onInvalidDate]);

    return (
        <div className="relative flex items-center border border-[#38A169] rounded-lg h-10 w-full">
            <input
                ref={textInputRef}
                type="text"
                inputMode="numeric"
                placeholder={placeholderText ?? "dd/mm/yyyy"}
                className="text-[#38A169] w-full flex-grow h-full bg-transparent focus:ring-0 focus:outline-none pl-3 pr-2 cursor-text z-10 relative" 
                value={displayValue}
                onChange={handleChange}
            />
            {/* Hidden native date input to leverage picker UI */}
            <input
                ref={dateInputRef}
                type="date"
                onChange={handleHiddenDateChange}
                className="hide-date-icon absolute opacity-0 pointer-events-none w-0 h-0"
                tabIndex={-1}
                aria-hidden="true"
            />
            <Image
                src={CalendarIcon}
                alt="CalendarIcon"
                width={20}
                height={20}
                onClick={handleIconClick}
                className="text-[#38A169] shrink-0 mr-3 cursor-pointer z-20 relative"
            />
        </div>
    );
};

export default DateBox;
