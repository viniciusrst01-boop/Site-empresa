export default function About() {
  return (
    <section className="max-w-7xl mx-auto px-10 py-24">

      <div className="grid lg:grid-cols-2 gap-16 items-center">

        <div>

          <p className="text-blue-400 uppercase tracking-widest text-sm">
            Sobre Nós
          </p>

          <h2 className="text-4xl font-bold mt-4">
            Qualidade que gera confiança e resultados
          </h2>

          <p className="text-slate-400 mt-6 text-lg leading-relaxed">
            A QualityPro Solutions nasce com o propósito de apoiar empresas na
            implementação e fortalecimento de Sistemas de Gestão da Qualidade,
            promovendo melhoria contínua, conformidade e aumento da eficiência
            operacional.
          </p>

          <p className="text-slate-400 mt-4 text-lg leading-relaxed">
            Atuamos com foco em ISO 9001, auditorias internas, treinamentos,
            indicadores de desempenho e desenvolvimento de processos que
            contribuem para a evolução das organizações.
          </p>

        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">

          <h3 className="text-2xl font-bold mb-6">
            Áreas de Atuação
          </h3>

          <div className="space-y-4">

            <div className="border-b border-slate-800 pb-3">
              Sistema de Gestão da Qualidade (ISO 9001)
            </div>

            <div className="border-b border-slate-800 pb-3">
              Auditorias Internas
            </div>

            <div className="border-b border-slate-800 pb-3">
              Treinamentos Corporativos
            </div>

            <div className="border-b border-slate-800 pb-3">
              Indicadores e KPIs
            </div>

            <div className="border-b border-slate-800 pb-3">
              Mapeamento de Processos
            </div>

            <div>
              Melhoria Contínua
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}