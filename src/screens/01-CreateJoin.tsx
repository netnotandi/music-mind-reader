import { useNavigate } from 'react-router-dom'
import { PlayerSwitcher } from '../components/PlayerSwitcher'

export function CreateJoin() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-100">Music Mind Reader</h1>
        <p className="mt-2 text-slate-400">
          Hversu vel þekkir þú tónlistarsmekk vina þinna — og hversu vel þekkja þeir þig?
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate('/lobby')}
          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          Stofna leik (leikstjóri)
        </button>
        <button
          type="button"
          onClick={() => navigate('/lobby')}
          className="rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-100 transition hover:border-slate-400"
        >
          Ganga í leik
        </button>
      </div>

      <div className="flex justify-center">
        <PlayerSwitcher />
      </div>
    </div>
  )
}
