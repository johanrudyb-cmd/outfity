export default function SpyLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
                <div className="space-y-2">
                    <div className="w-48 h-6 rounded-lg bg-white animate-pulse" />
                    <div className="w-72 h-3 rounded-lg bg-white/60 animate-pulse" />
                </div>
                <div className="h-48 rounded-[28px] bg-white animate-pulse border border-black/5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-[24px] bg-white animate-pulse border border-black/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}
