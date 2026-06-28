import Services from "@/components/Services";
import DashboardChart from "@/components/DashboardChart";
import About from "@/components/About";

export default function Home() {
  return (
    <main className="min-h-screen text-white">

      <header className="sticky top-0 z-50 flex justify-between items-center px-10 py-6 border-b border-slate-800 backdrop-blur-md bg-slate-950/40">
        <div>
  <h1 className="text-2xl font-bold">
    QualityPro Solutions
  </h1>

  <p className="text-xs text-slate-400">
    GestÃ£o da Qualidade e Melhoria ContÃ­nua
  </p>
</div>

        <nav className="flex gap-6">
          <a href="#">InÃ­cio</a>
          <a href="#">Sobre</a>
          <a href="#">ServiÃ§os</a>
          <a href="#">Contato</a>
        </nav>
      </header>

      <section className="relative max-w-7xl mx-auto px-10 py-32">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-600/20 blur-[180px] rounded-full -z-10" />

        <div className="grid lg:grid-cols-2 gap-12 items-center">

          <div>

            <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm">
              Consultoria em GestÃ£o da Qualidade
            </span>

            <h2 className="text-7xl font-bold leading-tight mt-6">
  ExcelÃªncia em
  <br />
  GestÃ£o da Qualidade,
  <br />
  Auditorias e
  <br />
  Melhoria ContÃ­nua
</h2>

            <p className="text-slate-400 text-xl mt-8">
              ImplementaÃ§Ã£o ISO 9001, auditorias,
              treinamentos, indicadores e melhoria contÃ­nua.
            </p>

            <button className="mt-10 bg-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 hover:bg-blue-500 transition-all duration-300">
              Solicitar OrÃ§amento
            </button>

          </div>

          <div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">

<div className="mb-6">

  <p className="text-blue-400 text-sm uppercase tracking-widest">
    QualityPro Solutions
  </p>

  <h3 className="text-3xl font-bold mt-2">
    SoluÃ§Ãµes em GestÃ£o da Qualidade
  </h3>

</div>

<DashboardChart />

<div className="space-y-4 mt-8">

  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
    <span>ISO 9001</span>
    <span className="text-blue-400 text-xl">âœ“</span>
  </div>

  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
    <span>Auditorias Internas</span>
    <span className="text-blue-400 text-xl">âœ“</span>
  </div>

  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
    <span>Treinamentos</span>
    <span className="text-blue-400 text-xl">âœ“</span>
  </div>

  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
    <span>Indicadores e KPIs</span>
    <span className="text-blue-400 text-xl">âœ“</span>
  </div>

  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
    <span>Mapeamento de Processos</span>
    <span className="text-blue-400 text-xl">âœ“</span>
  </div>

  <div className="flex justify-between items-center">
    <span>Melhoria ContÃ­nua</span>
    <span className="text-blue-400 text-xl">âœ“</span>
  </div>

</div>

            </div>

          </div>

        </div>

      </section>

      <About />
      <Services />

    </main>
  );
}
