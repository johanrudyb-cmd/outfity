export default function DesignStudioLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <div className="w-44 h-6 rounded-lg bg-white animate-pulse" />
                    <div className="w-72 h-3 rounded-lg bg-white/60 animate-pulse" />
                </div>

                {/* Tool cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="h-56 rounded-[28px] bg-white animate-pulse border border-black/5" />
                    <div className="h-56 rounded-[28px] bg-white animate-pulse border border-black/5" />
                </div>

                {/* Designs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-square rounded-[20px] bg-white animate-pulse border border-black/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}
