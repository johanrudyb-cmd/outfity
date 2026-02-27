export default function SettingsLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6">
                <div className="space-y-2">
                    <div className="w-40 h-6 rounded-lg bg-white animate-pulse" />
                    <div className="w-64 h-3 rounded-lg bg-white/60 animate-pulse" />
                </div>
                {/* Avatar + name section */}
                <div className="bg-white rounded-[24px] p-6 border border-black/5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#F5F5F7] animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="w-40 h-4 rounded-lg bg-[#F5F5F7] animate-pulse" />
                            <div className="w-56 h-3 rounded-lg bg-[#F5F5F7] animate-pulse" />
                        </div>
                    </div>
                </div>
                {/* Form fields */}
                <div className="bg-white rounded-[24px] p-6 border border-black/5 space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-2">
                            <div className="w-24 h-3 rounded bg-[#F5F5F7] animate-pulse" />
                            <div className="w-full h-10 rounded-xl bg-[#F5F5F7] animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
