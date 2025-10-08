import React, { useMemo, useState } from 'react';
import RequestInfoItem from './RequestInfoItem';
import Select from './Select';
import { useTranslations } from 'next-intl';

interface StatusOption {
    id: number;
    name: string;
    value: string;
}

const statusOptions: StatusOption[] = [
    { id: 1, name: "Mới (New)", value: "New" },
    { id: 2, name: "Đang xử lý (Processing)", value: "Processing" },
    { id: 3, name: "Hoàn thành (Completed)", value: "Completed" },
    { id: 4, name: "Đã đóng (Closed)", value: "Closed" },
];

interface RequestStatusAndResponseProps {
    initialStatusValue: string; 
    onSave: () => void;
    onCancel: () => void;
}

const RequestLogUpdate = ({ initialStatusValue, onSave, onCancel }: RequestStatusAndResponseProps) => {
      const t = useTranslations('customer-interaction.Request');
    
     const initialStatusObject = useMemo(() => 
        statusOptions.find(opt => opt.value === initialStatusValue), 
        [initialStatusValue]
    );

    const [selectedStatus, setSelectedStatus] = useState<StatusOption | undefined>(initialStatusObject);
    
    const [content, setContent] = useState('');

    const handleSave = () => {
        if (selectedStatus) {
            onSave();
        }
    };

    const handleCancel = () => {
        setSelectedStatus(initialStatusObject);
        setContent(''); 
        onCancel();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Request status:</h3>
                
                <Select
                    options={[
                        { name: t('new') },
                        { name: t('processing') },
                        { name: t('completed') },
                        { name: t('closed') },
                    ]}
                    onSelect={(item) => console.log('Selected item:', item)}
                    renderItem={(item) => item.name}
                    filterLogic={(item, keyword) =>
                        item.name.toLowerCase().includes(keyword.toLowerCase())
                    }
                    placeholder={t('status')}
                />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Respond :</h3>
            <textarea 
                rows={5} 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Nhập nội dung phản hồi tại đây..."
            ></textarea>
            
            <div className="flex justify-end space-x-3 mt-4">
                <button 
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    disabled={!selectedStatus || !content.trim()} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default RequestLogUpdate;
