import React from 'react'

type ToastState = { message: string; type: 'success' | 'error' } | null

type AppShellProps = {
  toast: ToastState
  sidebar: React.ReactNode
  children: React.ReactNode
  mainScrollRef?: React.RefObject<HTMLDivElement | null>
  onMainScroll?: () => void
}

export default function AppShell({ toast, sidebar, children, mainScrollRef, onMainScroll }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      <header
        className={`h-10 bg-slate-950 flex items-center justify-between select-none border-b border-slate-900 titlebar-drag ${
          (window as { api?: { platform?: string } }).api?.platform === 'darwin' ? 'pl-[76px] pr-6' : 'px-6'
        }`}
      >
        <div className="flex items-center space-x-2">
          <img src="./logo.png" className="h-4 w-4 object-contain" alt="" />
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Murmur Settings</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {toast && (
          <div
            className={`fixed top-12 right-6 px-4 py-3 rounded-lg shadow-xl text-sm transition-all duration-300 z-50 border ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-rose-950 border-rose-500 text-rose-300'
            }`}
          >
            {toast.message}
          </div>
        )}

        {sidebar}

        <main
          ref={mainScrollRef}
          onScroll={onMainScroll}
          className="flex-1 bg-slate-950 overflow-y-auto p-10 [scrollbar-gutter:stable]"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
