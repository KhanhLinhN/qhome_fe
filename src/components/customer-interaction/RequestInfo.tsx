import React from 'react';
import RequestInfoItem from './RequestInfoItem';

interface Title {
    title: string;
    key: string;
}

interface request {
    [key: string]: any;
}

interface RequestInfoAndContextProps {
    value: request;
    titleRequestInfo: Title[];
    contextTitle: string;
    contextContextTitle: string;
    contextImageTitle: string;

}

const RequestInfoAndContext = ({ value, titleRequestInfo, contextTitle, contextContextTitle, contextImageTitle } : RequestInfoAndContextProps) => {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className='border-b-3 border-[#CDCDCD] pb-4 mb-4'>
                    {titleRequestInfo.map((item, index) => (
                        <RequestInfoItem
                            key={index}
                            title={item.title}
                            value={value[item.key]}
                            isHighlighted={item.key === 'number'}
                        />
                    ))}
                </div>
                <h3 className="text-lg font-semibold mb-2">{contextTitle}</h3>
                <p className="text-[#016637] font-medium mb-4">{value.title}</p>

                <h3 className="text-lg font-semibold mb-2">{contextContextTitle}</h3>
                <p className="text-[#016637] mb-4 leading-relaxed">{value.context}</p>

                <h3 className="text-lg font-semibold mb-2">{contextImageTitle}</h3>
                <div className="w-48 h-32 bg-gray-200 border border-gray-300 rounded-md"></div>
            </div>
        </div>
    );
};

export default RequestInfoAndContext;
