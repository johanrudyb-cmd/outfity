export default function Loading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            {/* Top bar shimmer */}
            <div className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] animate-pulse" />
                <div className="w-32 h-4 rounded-lg bg-[#F5F5F7] animate-pulse" />
            </div>
            {/* Content skeleton */}
            <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
                <div className="space-y-3">
                    <div className="w-48 h-6 rounded-lg bg-white animate-pulse" />
                    <div className="w-72 h-4 rounded-lg bg-white/60 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 rounded-3xl bg-white animate-pulse border border-black/5" />
                    ))}
                </div>
                <div className="h-64 rounded-3xl bg-white animate-pulse border border-black/5" />
            </div>
        </div>
    );
}
