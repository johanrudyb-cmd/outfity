export default function CategoryLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white animate-pulse border border-black/5" />
                    <div className="space-y-2">
                        <div className="w-56 h-6 rounded-lg bg-white animate-pulse" />
                        <div className="w-36 h-3 rounded-lg bg-white/60 animate-pulse" />
                    </div>
                </div>

                {/* Segment tabs */}
                <div className="flex gap-2">
                    <div className="w-24 h-10 rounded-2xl bg-[#007AFF] animate-pulse" />
                    <div className="w-24 h-10 rounded-2xl bg-white animate-pulse" />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-72 rounded-[28px] bg-white animate-pulse border border-black/5" />
                    <div className="h-72 rounded-[28px] bg-white animate-pulse border border-black/5" />
                </div>

                {/* Style cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-56 rounded-[24px] bg-white animate-pulse border border-black/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}
