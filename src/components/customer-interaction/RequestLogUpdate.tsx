import React, { useState } from 'react';
import Select from './Select';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';
import DateBox from './DateBox';

export interface LogUpdateData {
    requestStatus: string;
    content: string;
    repairCost?: number;
    note?: string;
}

interface RequestStatusAndResponseProps {
    initialStatusValue: string;
    onSave: (data: LogUpdateData) => void;
    onAcceptDeny?: (action: string, fee: number | null, repairedDate: string | null, note: string) => Promise<void>;
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
    const [repairedDate, setRepairedDate] = useState<string>('');
    const [acceptFee, setAcceptFee] = useState<string>('');
    const [denyNote, setDenyNote] = useState('');

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
        setRepairedDate('');
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
                                {t('fee')}
                            </h3>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={acceptFee}
                                onChange={(e) => setAcceptFee(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                placeholder={t('enterFee')}
                            />
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {t('repairedDate')}
                            </h3>
                            <DateBox
                                value={repairedDate}
                                onChange={(e) => setRepairedDate(e.target.value)}
                                placeholderText={t('selectRepairedDate')}
                                min={new Date().toISOString().split('T')[0]} // Set min date to today
                            />
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {t('note')}
                            </h3>
                            <textarea
                                rows={5}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                placeholder={t('enterNote')}
                            ></textarea>
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
                            onChange={(e) => setDenyNote(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                            placeholder={t('enterDenyReason')}
                        ></textarea>
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-4">
                    <button
                        onClick={() => {
                            setAction('accept');
                            setAcceptFee('');
                            setRepairedDate('');
                            setNote('');
                            setDenyNote('');
                        }}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {t('clear')}
                    </button>
                    <button
                        onClick={async () => {
                            if (action === 'accept') {
                                // Validate all required fields
                                if (!acceptFee.trim() || !repairedDate.trim() || !note.trim()) {
                                    alert(t('allFieldsRequired'));
                                    return;
                                }
                                
                                // Validate fee is a valid number and not null
                                const fee = parseFloat(acceptFee.trim());
                                if (isNaN(fee) || fee < 0) {
                                    alert(t('invalidFee'));
                                    return;
                                }
                                
                                // Validate date is >= today
                                const selectedDate = new Date(repairedDate.trim());
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Reset time to compare dates only
                                
                                if (selectedDate < today) {
                                    alert(t('dateMustBeTodayOrLater') || 'Ngày sửa chữa phải lớn hơn hoặc bằng ngày hôm nay');
                                    return;
                                }
                                
                                // Validate note is not empty
                                if (!note.trim()) {
                                    alert(t('noteRequired') || 'Ghi chú là bắt buộc');
                                    return;
                                }
                                
                                try {
                                    await onAcceptDeny('accept', fee, repairedDate.trim(), note.trim());
                                    setAcceptFee('');
                                    setRepairedDate('');
                                    setNote('');
                                } catch (error) {
                                    console.error('Accept failed:', error);
                                }
                            } else {
                                // Validate deny note is not empty
                                if (!denyNote.trim()) {
                                    alert(t('denyReasonRequired'));
                                    return;
                                }
                                
                                try {
                                    await onAcceptDeny('deny', null, null, denyNote.trim());
                                    setDenyNote('');
                                } catch (error) {
                                    console.error('Deny failed:', error);
                                }
                            }
                        }}
                        disabled={isSubmitting || (action === 'accept' ? (!acceptFee.trim() || !repairedDate.trim() || !note.trim()) : !denyNote.trim())}
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
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
            </div>
        </div>
    );
};

export default RequestLogUpdate;
