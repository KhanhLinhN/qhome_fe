import React, { useEffect, useMemo, useState } from 'react';
import Select from './Select';
import { useTranslations } from 'next-intl';
import { useUsersByRole, User } from '@/src/hooks/useRequestGetUserByRole';

export type LogType = 'reply' | 'finance' | 'system';

export interface LogUpdateData {
    requestStatus: string;
    logType: LogType;
    content?: string;
    assignedUserId?: string;
    recordType : 'Request'
    staffInChargeName : string
}

interface RequestStatusAndResponseProps {
    initialStatusValue: string; 
    onSave: (data: LogUpdateData) => void;
    unactive: boolean;
    isSubmitting: boolean;
}

const RequestLogUpdate = ({ initialStatusValue, onSave, unactive, isSubmitting }: RequestStatusAndResponseProps) => {
    const t = useTranslations('customer-interaction.Request');

    const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusValue);
    const [logType, setLogType] = useState<'reply' | 'finance' | 'system'>('reply');
    const [content, setContent] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);


    const roleToFetch = useMemo(() => {
        if (logType === 'finance') return 'Finance';
        if (logType === 'system') return 'System';
        return null;
    }, [logType]);

    const { users, loading: usersLoading } = useUsersByRole(roleToFetch);
    
    useEffect(() => {
        setContent('');
        setSelectedUser(null);
    }, [logType]);

    const handleSave = async () => {
        const data: LogUpdateData = {
            requestStatus: selectedStatus,
            logType: logType,
            content: logType == null ? content : 'Assgined to ' + selectedUser?.name + ' : '+ content ,
            assignedUserId: selectedUser?.id,
            recordType: "Request",
            staffInChargeName: selectedUser ? selectedUser.name : ""
        };
        try {
            await onSave(data);
            handleCancel(); 
        } catch (error) {
            console.error("Save failed:", error);
        }
    };

    const handleCancel = () => {
        setSelectedStatus(initialStatusValue);
        setContent('');
        setLogType('reply');
        setSelectedUser(null);
    };

    if (unactive) {
        return (
            <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 text-center text-gray-500 italic">
                <p>{t('formInactiveMessage')}</p> 
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('status')}</h3>
                
                <Select
                    options={[{ name: t('processing'), value: 'Processing' }, { name: t('completed'), value: 'Completed'}]}
                    value={selectedStatus}
                    onSelect={(item) => setSelectedStatus(item.value)}
                    renderItem={(item) => item.name}
                    getValue={(item) => item.value}
                    placeholder={t('status')}
                    />
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('logType')}</h3>
                <div className="flex space-x-4">
                    {(['reply', 'finance', 'system'] as const).map(type => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="logType"
                                value={type}
                                checked={logType === type}
                                onChange={(e) => setLogType(e.target.value as LogType)}
                                className="form-radio text-green-600"
                            />
                            <span>{t(type)}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            {logType == 'reply' && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('response')}</h3>
                    <textarea 
                        rows={5} 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder={t('responsePlaceholder')}
                    ></textarea>
                </div>
            )}

            {(logType === 'finance' || logType === 'system') && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('assignTo')}</h3>
                    <Select<User>
                        options={users}
                        value={selectedUser?.id || ''}
                        onSelect={setSelectedUser}
                        getValue={(user) => user.id}
                        renderItem={(user) => user.name}
                        placeholder={usersLoading ? t('loading') : t('selectAssignee')}
                        disable={usersLoading}
                    />
                    <textarea 
                        rows={5} 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder={t('responsePlaceholder')}
                    ></textarea>
                </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
                <button 
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                    {t('clear')}
                </button>
                <button 
                    onClick={handleSave}
                    disabled={logType == "reply" && !content.trim() || logType != "reply" && !selectedUser?.id || isSubmitting} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('save')}
                </button>
            </div>
        </div>
    );
};

export default RequestLogUpdate;
