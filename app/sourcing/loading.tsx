export default function SourcingLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
                <div className="space-y-2">
                    <div className="w-52 h-6 rounded-lg bg-white animate-pulse" />
                    <div className="w-72 h-3 rounded-lg bg-white/60 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-56 rounded-[24px] bg-white animate-pulse border border-black/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}
