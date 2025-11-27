import React, { useState } from 'react';
import Select from './Select';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';

export interface LogUpdateData {
    requestStatus: string;
    content: string;
    repairCost?: number;
    note?: string;
}

interface RequestStatusAndResponseProps {
    initialStatusValue: string;
    onSave: (data: LogUpdateData) => void;
    onAcceptDeny?: (action: string, adminResponse: string | null, fee: number | null, note: string) => Promise<void>;
    unactive: boolean;
    isSubmitting: boolean;
}

const RequestLogUpdate = ({ initialStatusValue, onSave, onAcceptDeny, unactive, isSubmitting }: RequestStatusAndResponseProps) => {
    const t = useTranslations('customer-interaction.Request');
    const { user } = useAuth();

    const [content, setContent] = useState('');
    const [repairCost, setRepairCost] = useState<string>('');
    const [note, setNote] = useState('');
    const [action, setAction] = useState<'accept' | 'deny'>('accept'); // For New status
    const [adminResponse, setAdminResponse] = useState<string>('');
    const [acceptFee, setAcceptFee] = useState<string>('');
    const [denyNote, setDenyNote] = useState('');
    
    // Error states
    const [errors, setErrors] = useState<{
        adminResponse?: string;
        acceptFee?: string;
        note?: string;
        denyNote?: string;
    }>({});

    const isNewStatus = initialStatusValue === 'New' || initialStatusValue === 'new';
    const isPendingStatus = initialStatusValue === 'Pending' || initialStatusValue === 'pending';

    const handleSave = async () => {
        // For other statuses (not New): require content
        const trimmed = content.trim();
        if (!trimmed) {
            return;
        }
        const data: LogUpdateData = {
            requestStatus: initialStatusValue, // Use initial status instead of selected status
            content: trimmed,
        };
        try {
            await onSave(data);
            handleCancel();
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    const handleCancel = () => {
        setContent('');
        setRepairCost('');
        setNote('');
        setAcceptFee('');
        setAdminResponse('');
        setDenyNote('');
        setAction('accept');
    };

    if (unactive) {
        return (
            <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 text-center text-gray-500 italic">
                <p>{t('formInactiveMessage')}</p>
            </div>
        );
    }

    // Determine if save button should be disabled
    const isSaveDisabled = isSubmitting || isPendingStatus || content.trim().length === 0;

    // If status is New and onAcceptDeny is available, show accept/deny form
    if (isNewStatus && onAcceptDeny) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {/* Toggle/Tab for Accept/Deny */}
                <div className="mb-4 flex gap-2 border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setAction('accept')}
                        className={`px-4 py-2 font-semibold transition ${
                            action === 'accept'
                                ? 'text-green-600 border-b-2 border-green-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t('accept')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('deny')}
                        className={`px-4 py-2 font-semibold transition ${
                            action === 'deny'
                                ? 'text-red-600 border-b-2 border-red-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t('deny')}
                    </button>
                </div>

                {action === 'accept' ? (
                    <>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {t('adminResponse') || 'Mô tả vấn đề hỏng hóc'}
                            </h3>
                            <textarea
                                rows={5}
                                value={adminResponse}
                                onChange={(e) => {
                                    setAdminResponse(e.target.value);
                                    if (errors.adminResponse) {
                                        setErrors(prev => ({ ...prev, adminResponse: undefined }));
                                    }
                                }}
                                className={`w-full p-3 border rounded-md focus:outline-none shadow-inner transition duration-150 ${
                                    errors.adminResponse 
                                        ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                                }`}
                                placeholder={t('adminResponsePlaceholder') || 'Nhập mô tả vấn đề hỏng hóc...'}
                            ></textarea>
                            {errors.adminResponse && (
                                <span className="text-red-500 text-xs mt-1">{errors.adminResponse}</span>
                            )}
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {t('fee')}
                            </h3>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={acceptFee}
                                onChange={(e) => {
                                    setAcceptFee(e.target.value);
                                    if (errors.acceptFee) {
                                        setErrors(prev => ({ ...prev, acceptFee: undefined }));
                                    }
                                }}
                                className={`w-full p-3 border rounded-md focus:outline-none shadow-inner transition duration-150 ${
                                    errors.acceptFee 
                                        ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                                }`}
                                placeholder={t('enterFee')}
                            />
                            {errors.acceptFee && (
                                <span className="text-red-500 text-xs mt-1">{errors.acceptFee}</span>
                            )}
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {t('note')}
                            </h3>
                            <textarea
                                rows={5}
                                value={note}
                                onChange={(e) => {
                                    setNote(e.target.value);
                                    if (errors.note) {
                                        setErrors(prev => ({ ...prev, note: undefined }));
                                    }
                                }}
                                className={`w-full p-3 border rounded-md focus:outline-none resize-none shadow-inner transition duration-150 ${
                                    errors.note 
                                        ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                                }`}
                                placeholder={t('enterNote')}
                            ></textarea>
                            {errors.note && (
                                <span className="text-red-500 text-xs mt-1">{errors.note}</span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {t('denyReason')}
                        </h3>
                        <textarea
                            rows={5}
                            value={denyNote}
                            onChange={(e) => {
                                setDenyNote(e.target.value);
                                if (errors.denyNote) {
                                    setErrors(prev => ({ ...prev, denyNote: undefined }));
                                }
                            }}
                            className={`w-full p-3 border rounded-md focus:outline-none resize-none shadow-inner transition duration-150 ${
                                errors.denyNote 
                                    ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                            }`}
                            placeholder={t('enterDenyReason')}
                        ></textarea>
                        {errors.denyNote && (
                            <span className="text-red-500 text-xs mt-1">{errors.denyNote}</span>
                        )}
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-4">
                    <button
                        onClick={() => {
                            setAction('accept');
                            setAcceptFee('');
                            setAdminResponse('');
                            setNote('');
                            setDenyNote('');
                            setErrors({});
                        }}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {t('clear')}
                    </button>
                    <button
                        onClick={async () => {
                            if (action === 'accept') {
                                // Reset errors
                                setErrors({});
                                
                                // Validate all required fields
                                const newErrors: typeof errors = {};
                                
                                // Validate adminResponse is not empty
                                if (!adminResponse.trim()) {
                                    newErrors.adminResponse = t('adminResponseRequired');
                                }
                                
                                // Validate fee is a valid number and not null
                                if (!acceptFee.trim()) {
                                    newErrors.acceptFee = t('allFieldsRequired');
                                } else {
                                    const fee = parseFloat(acceptFee.trim());
                                    if (isNaN(fee) || fee < 0) {
                                        newErrors.acceptFee = t('invalidFee');
                                    }
                                }
                                
                                // Validate note is not empty
                                if (!note.trim()) {
                                    newErrors.note = t('noteRequired');
                                }
                                
                                // If there are errors, set them and return
                                if (Object.keys(newErrors).length > 0) {
                                    setErrors(newErrors);
                                    return;
                                }
                                
                                // All validations passed
                                const fee = parseFloat(acceptFee.trim());
                                try {
                                    await onAcceptDeny('accept', adminResponse.trim(), fee, note.trim());
                                    setAcceptFee('');
                                    setAdminResponse('');
                                    setNote('');
                                    setErrors({});
                                } catch (error) {
                                    console.error('Accept failed:', error);
                                }
                            } else {
                                // Reset errors
                                setErrors({});
                                
                                // Validate deny note is not empty
                                if (!denyNote.trim()) {
                                    setErrors({ denyNote: t('denyReasonRequired') });
                                    return;
                                }
                                
                                try {
                                    await onAcceptDeny('deny', null, null, denyNote.trim());
                                    setDenyNote('');
                                    setErrors({});
                                } catch (error) {
                                    console.error('Deny failed:', error);
                                }
                            }
                        }}
                        disabled={isSubmitting || (action === 'accept' ? (!adminResponse.trim() || !acceptFee.trim() || !note.trim()) : !denyNote.trim())}
                        className={`px-4 py-2 text-white rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                            action === 'accept'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {action === 'accept' ? t('accept') : t('deny')}
                    </button>
                </div>
            </div>
        );
    }

    // For other statuses, show normal response form
    // return (
    //     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {/* <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('response')}</h3>
                <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder={t('responsePlaceholder')}
                ></textarea>
            </div>

            {isPendingStatus && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                    {t('pendingStatusMessage')}
                </div>
            )}

            <div className="flex justify-end space-x-3 mt-4">
                <button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                >
                    {t('clear')}
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('save')}
                </button>
            </div> */}
    //     </div>
    // );
};

export default RequestLogUpdate;
