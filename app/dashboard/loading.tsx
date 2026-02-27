export default function DashboardLoading() {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-10 max-w-7xl mx-auto w-full space-y-6">
                {/* Hero greeting skeleton */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-black/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-5 rounded-lg bg-[#F5F5F7] animate-pulse" />
                            <div className="w-64 h-3 rounded-lg bg-[#F5F5F7] animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 sm:h-28 rounded-[24px] bg-white animate-pulse border border-black/5" />
                    ))}
                </div>

                {/* Quick actions / tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-48 rounded-[28px] bg-white animate-pulse border border-black/5" />
                    <div className="h-48 rounded-[28px] bg-white animate-pulse border border-black/5" />
                </div>

                {/* Activity */}
                <div className="h-64 rounded-[28px] bg-white animate-pulse border border-black/5" />
            </div>
        </div>
    );
}
