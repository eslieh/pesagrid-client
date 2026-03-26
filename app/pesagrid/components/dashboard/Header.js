"use client";

export default function Header({ user, onAddWidget }) {
  return (
    <header className="flex h-[68px] items-center justify-between border-b border-zinc-100 bg-white px-8">
      {/* Search */}
      <div className="flex w-72 items-center gap-2.5 rounded-full bg-zinc-50 border border-zinc-100 px-4 py-2.5">
        <svg className="h-3.5 w-3.5 flex-shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Quick search"
          className="w-full bg-transparent text-[13px] text-zinc-700 outline-none placeholder:text-zinc-300"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors">
          <svg className="h-4.5 w-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Settings */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2.5 rounded-full border border-zinc-100 bg-white px-3 py-1.5">
          <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=e4e4e7&color=52525b&size=64`}
              className="h-full w-full object-cover"
              alt={user?.name || "User"}
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-semibold text-zinc-900">{user?.name || "Michael Johnson"}</span>
            <span className="text-[10px] text-zinc-400">{user?.email || "m.johnson@lines.com"}</span>
          </div>
        </div>

        {/* Add widget */}
        <button
          onClick={onAddWidget}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[12px] font-medium text-zinc-700 transition-all hover:bg-zinc-50 hover:shadow-sm active:scale-95"
        >
          <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add widget
        </button>
      </div>
    </header>
  );
}
