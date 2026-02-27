export default function CalculatorLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6">
                <div className="space-y-2">
                    <div className="w-56 h-6 rounded-lg bg-white animate-pulse" />
                    <div className="w-80 h-3 rounded-lg bg-white/60 animate-pulse" />
                </div>
                <div className="h-96 rounded-[28px] bg-white animate-pulse border border-black/5" />
            </div>
        </div>
    );
}
