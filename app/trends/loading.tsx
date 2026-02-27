export default function TrendsLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            {/* Ticker placeholder */}
            <div className="h-10 bg-white border-b border-black/5 animate-pulse" />

            {/* Header */}
            <div className="bg-white border-b border-black/5 pt-16 pb-14">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="space-y-4">
                        <div className="w-32 h-3 rounded-full bg-[#007AFF]/20 animate-pulse" />
                        <div className="w-80 h-12 rounded-xl bg-[#F5F5F7] animate-pulse" />
                    </div>
                    <div className="flex gap-2 mt-8">
                        <div className="w-28 h-12 rounded-xl bg-[#007AFF] animate-pulse" />
                        <div className="w-28 h-12 rounded-xl bg-[#F5F5F7] animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Category cards grid */}
            <div className="max-w-7xl mx-auto px-6 py-16 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[400px] rounded-[50px] bg-white animate-pulse border border-black/5 shadow-sm" />
                    ))}
                </div>
            </div>
        </div>
    );
}
