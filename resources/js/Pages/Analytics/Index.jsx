
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

import GlobalFilter from './Components/GlobalFilter';
import SummaryStatistics from './Components/SummaryStatistics';
import RegionDistribution from './Components/RegionDistribution';
import AnalysisTable from './Components/AnalysisTable';

const modules = [
    { key: 'catin', label: 'Catin' },
    { key: 'bumil', label: 'Bumil' },
    { key: 'bulin', label: 'Bulin' },
    { key: 'baduta', label: 'Baduta' },
];

export default function Index({
    summary = {},
    risks = {},
    filters = {},
    months = [],
    kemantrens = [],
    kelurahans = [],
    role = '',
}) {
    const { url, props } = usePage();

    // Ambil data user untuk layout sidebar
    const user = props.auth?.user;

    // Baca modul dari URL sidebar
    // Contoh: /analytics?module=catin
    const params = new URLSearchParams(
        url.split('?')[1] ?? ''
    );

    const requestedModule = params.get('module');

    const activeModule = modules.some(
        (item) => item.key === requestedModule
    )
        ? requestedModule
        : 'bumil';

    const selected = modules.find(
        (item) => item.key === activeModule
    );

    // Berpindah modul sambil mempertahankan filter
    const changeModule = (module) => {
        router.get(
            '/analytics',
            {
                module,
                month: filters.month ?? '',
                kemantren: filters.kemantren ?? '',
                kelurahan: filters.kelurahan ?? '',
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    return (
        <AuthenticatedLayout user={user}>
            <Head title="Progress Analytics" />

            <div className="min-h-screen bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">

                    {/* JUDUL HALAMAN */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Progress Analytics
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            {selected.label} Berisiko
                        </p>
                    </div>

                    {/* PILIHAN MODUL */}
                    <div className="flex flex-wrap gap-2">
                        {modules.map((module) => (
                            <button
                                key={module.key}
                                type="button"
                                onClick={() => changeModule(module.key)}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                    activeModule === module.key
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {module.label}
                            </button>
                        ))}
                    </div>

                    {/* GLOBAL FILTER */}
                    <GlobalFilter
                        filters={filters}
                        months={months}
                        kemantrens={kemantrens}
                        kelurahans={kelurahans}
                        role={role}
                    />

                    {/* STATISTIK DAN SEBARAN */}
                    <div className="grid gap-5 lg:grid-cols-3">
                        <SummaryStatistics
                            label={selected.label}
                            total={summary[activeModule] ?? 0}
                            riskData={risks[activeModule] ?? []}
                        />

                        <div className="lg:col-span-2">
                            <RegionDistribution />
                        </div>
                    </div>

                    {/* TABEL ANALISIS */}
                    <AnalysisTable
                        label={selected.label}
                    />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
