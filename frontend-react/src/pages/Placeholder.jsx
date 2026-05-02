export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
      <div className="text-5xl">🚧</div>
      <p className="text-base font-semibold text-slate-600">{title}</p>
      <p className="text-sm">Esta seção está em desenvolvimento.</p>
    </div>
  )
}
