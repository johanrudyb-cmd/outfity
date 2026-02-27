export default function PhaseLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
                {/* Phase header */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white animate-pulse border border-black/5" />
                    <div className="space-y-2 flex-1">
                        <div className="w-44 h-5 rounded-lg bg-white animate-pulse" />
                        <div className="w-64 h-3 rounded-lg bg-white/60 animate-pulse" />
                    </div>
                </div>
                {/* Agent chat / content area */}
                <div className="h-[60vh] rounded-[28px] bg-white animate-pulse border border-black/5" />
            </div>
        </div>
    );
}
