import React from 'react';

interface TabData {
    title: string;
    count: number;
    status: string;
}

interface TabProps {
    tabList: TabData[];
    type: string;
    activeStatus: string;
}

const StatusTabs = ({ tabList, type,  activeStatus }: TabProps) => {

    return (
        <div className="flex border-b border-green-500 bg-[#F3F3F3] rounded-[8px]">
            {tabList.map((tab) => (
                <div 
                    key={tab.status}
                    className={`pt-5 pb-5 flex w-full text-[#012715] hover:text-gray-700`}
                >
                    <div 
                        className={`
                            px-6 text-left cursor-pointer transition duration-150 ease-in-out  w-full
                            ${tabList.indexOf(tab) < tabList.length - 1 ? 'border-r-2 border-[#BBBBBB]' : ''}
                        `}
                    >
                    <p className="text-lg font-bold">{tab.title}</p>
                    <p className="text-md font-medium">{tab.count} {type}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatusTabs;
