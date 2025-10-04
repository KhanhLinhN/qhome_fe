import React from 'react';

interface TabData {
    title: string;
    count: number;
    status: string;
}

interface TabProps {
    tab: TabData[];
}

const StatusTabs = (tabProps: TabProps) => {
    const [activeTab, setActiveTab] = React.useState('');

    return (
        <div className="flex border-b border-green-500 bg-[#F3F3F3] rounded-[8px]">
            {tabProps.tab.map((tab) => (
                <div className={`pt-5 pb-5 flex w-full
                    ${activeTab === tab.status 
                        ? 'border-t-4 border-green-500 text-green-600 font-semibold' 
                        : 'text-[#012715] hover:text-gray-700'
                    }`}>
                        <div 
                        key={tab.status}
                    onClick={() => setActiveTab(tab.status)}
                    className={`
                        px-6 text-left cursor-pointer transition duration-150 ease-in-out  w-full
                        
                        ${tabProps.tab.indexOf(tab) < tabProps.tab.length - 1 ? 'border-r-2 border-[#BBBBBB]' : ''}
                    `}
                >
                    <p className="text-lg font-bold">{tab.title}</p>
                    <p className="text-md font-medium">{tab.count} request</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatusTabs;
