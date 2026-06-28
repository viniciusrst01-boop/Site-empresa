import {
  ClipboardCheck,
  ShieldCheck,
  GraduationCap,
  BarChart3,
  Workflow,
  TrendingUp,
} from "lucide-react";

export default function Services() {
  const services = [
    {
      title: "ISO 9001",
      icon: ClipboardCheck,
    },
    {
      title: "Auditorias",
      icon: ShieldCheck,
    },
    {
      title: "Treinamentos",
      icon: GraduationCap,
    },
    {
      title: "Indicadores",
      icon: BarChart3,
    },
    {
      title: "Processos",
      icon: Workflow,
    },
    {
      title: "Melhoria Contínua",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-10 py-20">
      <h2 className="text-4xl font-bold mb-10">
        Nossos Serviços
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <div
              key={service.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition"
            >
              <Icon size={40} />

              <h3 className="text-xl font-semibold mt-4">
                {service.title}
              </h3>
            </div>
          );
        })}
      </div>
    </section>
  );
}