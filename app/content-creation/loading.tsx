export default function ContentCreationLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
                <div className="space-y-2">
                    <div className="w-48 h-6 rounded-lg bg-white animate-pulse" />
                    <div className="w-64 h-3 rounded-lg bg-white/60 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="h-48 rounded-[28px] bg-white animate-pulse border border-black/5" />
                    <div className="h-48 rounded-[28px] bg-white animate-pulse border border-black/5" />
                </div>
                <div className="h-64 rounded-[28px] bg-white animate-pulse border border-black/5" />
            </div>
        </div>
    );
}
