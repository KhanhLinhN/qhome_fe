import React from 'react';
import RequestInfoItem from './RequestInfoItem';

interface RequestLogUpdateProps {
    label: string;
    value: string | number;
    isBold?: boolean; 
}

const RequestLogUpdate = ({ label, value, isBold = false }: RequestLogUpdateProps) => {
    return (
        <div></div>
    );
};

export default RequestLogUpdate;
