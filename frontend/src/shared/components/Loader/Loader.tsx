import './Loader.css';

export default function Loader() {
    return (
        <>
            {/* create loader spinner & overlay with animation */}
            {/* <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50">
                <div className="bg-[#111] p-4 px-8 rounded-[1.25rem]">
                    <div className="text-gray-500 text-[25px] font-medium h-10 py-2.5 px-2.5 flex rounded-lg box-content">
                        <p>loading</p>
                        <div className="words-container overflow-hidden relative">
                            <div className="animation-[spin_words] duration-[8s] animate-infinite">
                                <span className="block h-full pl-1.5 text-[#956afa]">buttons</span>
                                <span className="block h-full pl-1.5 text-[#956afa]">forms</span>
                                <span className="block h-full pl-1.5 text-[#956afa]">switches</span>
                                <span className="block h-full pl-1.5 text-[#956afa]">cards</span>
                                <span className="block h-full pl-1.5 text-[#956afa]">buttons</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* overlay */}
            <div className="fixed inset-0 bg-gray-800/50 flex items-center justify-center z-50">
                <div className="bg-[#111] px-4 py-5 rounded-2xl">
                    <div className="flex text-2xl font-medium text-gray-500 h-10 p-3 box-content">
                        <p>Loading</p>
                        <div className="overflow-hidden relative after:absolute after:inset-0 after:bg-linear-60 from-slate-700 to-slate-900 after:z-20 after:animate-shine">
                            <span className="block h-full pl-1.5 text-[#956afa] animate-text-flow animate-duration-[4s] animate-infinite ease-in-out">Bootstrapping</span>
                            <span className="block h-full pl-1.5 text-[#956afa] animate-text-flow animate-duration-[4s] animate-infinite ease-in-out">Modules</span>
                            <span className="block h-full pl-1.5 text-[#956afa] animate-text-flow animate-duration-[4s] animate-infinite ease-in-out">Dependencies</span>
                            <span className="block h-full pl-1.5 text-[#956afa] animate-text-flow animate-duration-[4s] animate-infinite ease-in-out">Optimizing</span>
                            <span className="block h-full pl-1.5 text-[#956afa] animate-text-flow animate-duration-[4s] animate-infinite ease-in-out">Render UI</span>
                            <span className="block h-full pl-1.5 text-[#956afa] animate-text-flow animate-duration-[4s] animate-infinite ease-in-out">Bootstrapping</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
