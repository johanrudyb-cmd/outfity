export default function LaunchMapLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-10 max-w-7xl mx-auto w-full space-y-6">
                {/* Brand hero */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-black/5">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="w-48 h-5 rounded-lg bg-[#F5F5F7] animate-pulse" />
                            <div className="w-32 h-3 rounded-lg bg-[#F5F5F7] animate-pulse" />
                        </div>
                        <div className="w-24 h-10 rounded-2xl bg-[#F5F5F7] animate-pulse hidden sm:block" />
                    </div>
                </div>

                {/* Progress bar */}
                <div className="bg-white rounded-[24px] p-5 border border-black/5">
                    <div className="w-full h-3 rounded-full bg-[#F5F5F7] animate-pulse" />
                </div>

                {/* Phases grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-44 rounded-[28px] bg-white animate-pulse border border-black/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}
