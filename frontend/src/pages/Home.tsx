import { MagicBentoMenu } from "../components/bento/MagicBentoMenu"

export default function HomePage() {
  return (
    <section className="page-shell">
      <header className="page-header panel">
        <h1 className="page-title">Padel Host App</h1>
        <p className="page-subtitle">Launch events quickly, run rounds clearly, and keep scoring momentum.</p>
      </header>
      <section className="panel">
        <MagicBentoMenu />
      </section>
    </section>
  )
}
