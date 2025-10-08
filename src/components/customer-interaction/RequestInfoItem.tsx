interface RequestInfoProps {
    title: String;
    value: String;
    isHighlighted?: Boolean;
}

const InfoRow = ({ value, title, isHighlighted } : RequestInfoProps) => (
    <div className="flex justify-between py-1">
        <span className="text-[#024023] font-bold">{title}:</span>
        <span className={`${isHighlighted ? "text-[#14AE5C]" : "text-[#024023]"} font-semibold`}>{value}</span>
    </div>
);

export default InfoRow;
