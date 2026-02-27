export default function UGCLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white animate-pulse border border-black/5" />
                    <div className="space-y-2">
                        <div className="w-32 h-5 rounded-lg bg-white animate-pulse" />
                        <div className="w-56 h-3 rounded-lg bg-white/60 animate-pulse" />
                    </div>
                </div>

                {/* Tab buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 rounded-[24px] bg-white animate-pulse border border-black/5" />
                    ))}
                </div>

                {/* Content area */}
                <div className="h-96 rounded-[32px] bg-white animate-pulse border border-black/5" />
            </div>
        </div>
    );
}
