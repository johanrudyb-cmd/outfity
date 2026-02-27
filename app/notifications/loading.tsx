export default function NotificationsLoading() {
    return (
        <div className="flex-1 flex flex-col bg-[#F5F5F7] animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-4">
                <div className="w-44 h-6 rounded-lg bg-white animate-pulse" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 rounded-2xl bg-white animate-pulse border border-black/5" />
                ))}
            </div>
        </div>
    );
}
