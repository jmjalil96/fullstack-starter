import { useState } from 'react'

// Icons as simple components for cleanliness
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
)
const TrendUpIcon = () => (
  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
)
const TrendDownIcon = () => (
  <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
    />
  </svg>
)
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* --- Header & Controls --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-navy)] tracking-tight">
            Panel General
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 font-medium opacity-80">
            Bienvenido de nuevo, Administrador
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Glass Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar póliza, cliente o ID..."
              className="block w-64 pl-10 pr-4 py-2.5 bg-white/40 backdrop-blur-md border border-white/30 rounded-xl text-sm text-[var(--color-navy)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 focus:bg-white/60 transition-all shadow-sm"
            />
          </div>

          {/* Action Button */}
          <button className="flex items-center gap-2 bg-[var(--color-navy)] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-900/20 hover:bg-[var(--color-navy-600)] hover:scale-[1.02] transition-all active:scale-[0.98]">
            <PlusIcon />
            <span>Nueva Solicitud</span>
          </button>
        </div>
      </div>

      {/* --- KPI Cards (Glassmorphism) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Primas Totales',
            value: '$124,500',
            change: '+12.5%',
            positive: true,
            graph: [40, 35, 50, 60, 75, 65, 80],
          },
          {
            label: 'Reclamos Activos',
            value: '42',
            change: '-2.4%',
            positive: true,
            graph: [60, 55, 45, 40, 35, 45, 42],
          },
          {
            label: 'Nuevos Clientes',
            value: '18',
            change: '+8.2%',
            positive: true,
            graph: [10, 15, 12, 18, 20, 15, 18],
          },
          {
            label: 'Tasa de Renovación',
            value: '94%',
            change: '-1.1%',
            positive: false,
            graph: [95, 94, 96, 95, 93, 94, 94],
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] group hover:bg-white/80 transition-colors duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-[var(--color-navy)] mt-1">{stat.value}</h3>
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${
                  stat.positive
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                    : 'bg-rose-50/50 border-rose-100 text-rose-700'
                }`}
              >
                {stat.change}
                {stat.positive ? <TrendUpIcon /> : <TrendDownIcon />}
              </div>
            </div>

            {/* Mini Sparkline Visualization */}
            <div className="h-10 flex items-end gap-1 opacity-50 group-hover:opacity-80 transition-opacity">
              {stat.graph.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t-sm ${
                    stat.positive ? 'bg-[var(--color-navy)]' : 'bg-rose-400'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- Main Dashboard Area --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Analytics Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-navy)]">
                Análisis de Rendimiento
              </h2>
              <div className="flex bg-gray-100/50 p-1 rounded-lg">
                {['Semana', 'Mes', 'Año'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      activeTab === t
                        ? 'bg-white text-[var(--color-navy)] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Mock Bar Chart */}
            <div className="h-64 w-full flex items-end justify-between gap-4 px-2">
              {[35, 55, 45, 70, 60, 85, 65, 50, 75, 90, 55, 40].map((h, i) => (
                <div
                  key={i}
                  className="group relative w-full bg-gray-100/50 rounded-t-xl hover:bg-blue-50 transition-colors h-full flex items-end"
                >
                  <div
                    style={{ height: `${h}%` }}
                    className="w-full bg-[var(--color-navy)] opacity-80 group-hover:opacity-100 rounded-t-lg transition-all duration-500 relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-navy)] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      ${h}k
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase">
              <span>Ene</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Ago</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dic</span>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100/50 flex justify-between items-center">
              <h3 className="font-bold text-[var(--color-navy)]">Transacciones Recientes</h3>
              <button className="text-xs text-[var(--color-teal)] font-bold hover:underline">
                VER TODO
              </button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 font-medium">ID Transacción</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium text-right">Monto</th>
                  <th className="px-6 py-3 font-medium text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50">
                {[
                  {
                    id: '#TR-9812',
                    client: 'TechSolutions Inc.',
                    date: 'Hace 2 horas',
                    amount: '$1,200.00',
                    status: 'Completado',
                  },
                  {
                    id: '#TR-9811',
                    client: 'Grupo Logístico',
                    date: 'Hace 5 horas',
                    amount: '$3,450.00',
                    status: 'Pendiente',
                  },
                  {
                    id: '#TR-9810',
                    client: 'Consultora Apex',
                    date: 'Ayer',
                    amount: '$890.00',
                    status: 'Completado',
                  },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-navy)]">{row.id}</td>
                    <td className="px-6 py-4 text-gray-600">{row.client}</td>
                    <td className="px-6 py-4 text-gray-400">{row.date}</td>
                    <td className="px-6 py-4 text-right font-bold text-[var(--color-navy)]">
                      {row.amount}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'Completado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Side Panel */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-[var(--color-navy)] rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[var(--color-gold)]/20 rounded-full blur-3xl" />

            <h3 className="relative z-10 text-lg font-bold mb-4">Centro de Comandos</h3>
            <div className="relative z-10 grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Reporte',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ),
                },
                {
                  label: 'Usuario',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  ),
                },
                {
                  label: 'Cargar',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  ),
                },
                {
                  label: 'Config',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  ),
                },
              ].map((btn, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/5 p-3 rounded-xl transition-all active:scale-95"
                >
                  {btn.icon}
                  <span className="text-xs font-medium">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications / Feed */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--color-navy)]">Notificaciones</h3>
              <button className="p-1 hover:bg-gray-100 rounded-lg">
                <FilterIcon />
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: 'Póliza Aprobada',
                  desc: 'La póliza #9921 ha sido aprobada exitosamente.',
                  time: '10m',
                  type: 'success',
                },
                {
                  title: 'Documento Faltante',
                  desc: 'Cliente Juan Perez necesita subir DNI.',
                  time: '45m',
                  type: 'warning',
                },
                {
                  title: 'Sistema Actualizado',
                  desc: 'Mantenimiento programado para las 23:00.',
                  time: '2h',
                  type: 'info',
                },
              ].map((notif, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start p-3 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
                >
                  <div
                    className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      notif.type === 'success'
                        ? 'bg-emerald-500'
                        : notif.type === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{notif.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.desc}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">{notif.time} ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
