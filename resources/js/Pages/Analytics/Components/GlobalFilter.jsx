
import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';

export default function GlobalFilter({
    filters = {},
    months = [],
    kemantrens = [],
    kelurahans = [],
    role = '',
}) {
    const { url } = usePage();

    // Membaca modul Analytics dari URL
    // Contoh: /analytics?module=catin
    const params = new URLSearchParams(
        url.split('?')[1] ?? ''
    );

    const requestedModule = params.get('module');

    const activeModule = [
        'catin',
        'bumil',
        'bulin',
        'baduta',
    ].includes(requestedModule)
        ? requestedModule
        : 'bumil';

    // State pilihan filter
    const [month, setMonth] = useState(
        filters.month ?? ''
    );

    const [kemantren, setKemantren] = useState(
        String(filters.kemantren ?? '')
    );

    const [kelurahan, setKelurahan] = useState(
        String(filters.kelurahan ?? '')
    );

    // Sinkronkan filter dengan data Laravel
    useEffect(() => {
        setMonth(filters.month ?? '');

        setKemantren(
            String(filters.kemantren ?? '')
        );

        setKelurahan(
            String(filters.kelurahan ?? '')
        );
    }, [
        filters.month,
        filters.kemantren,
        filters.kelurahan,
    ]);

    // Filter kelurahan berdasarkan kemantren
    const availableKelurahans = kelurahans.filter(
        (item) =>
            !kemantren ||
            String(item.kemantren_id) === kemantren
    );

    // Terapkan filter tanpa mengganti modul
    const handleApply = () => {
        router.get(
            '/analytics',
            {
                module: activeModule,
                month,
                kemantren,
                kelurahan,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    // Reset filter tetapi tetap di modul aktif
    const handleReset = () => {
        router.get(
            '/analytics',
            {
                module: activeModule,
            },
            {
                preserveScroll: true,
                replace: true,
            }
        );
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex flex-wrap items-end gap-4">

                {/* JUDUL GLOBAL FILTER */}
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <span>☷</span>
                    Global Filter
                </div>

                {/* BULAN LAPORAN */}
                <div className="min-w-[150px] flex-1">
                    <label className="mb-1 block text-xs text-gray-500">
                        Bulan Laporan
                    </label>

                    <select
                        value={month}
                        onChange={(e) =>
                            setMonth(e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 text-sm focus:border-teal-500 focus:ring-teal-500"
                    >
                        <option value="">
                            Semua Periode
                        </option>

                        {months.map((item) => (
                            <option
                                key={item.value}
                                value={item.value}
                            >
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* KEMANTREN */}
                <div className="min-w-[150px] flex-1">
                    <label className="mb-1 block text-xs text-gray-500">
                        Kemantren (Kecamatan)
                    </label>

                    <select
                        value={kemantren}
                        disabled={role !== 'superadmin'}
                        onChange={(e) => {
                            setKemantren(e.target.value);
                            setKelurahan('');
                        }}
                        className="w-full rounded-md border-gray-300 text-sm focus:border-teal-500 focus:ring-teal-500 disabled:bg-gray-100"
                    >
                        <option value="">
                            Semua Kemantren
                        </option>

                        {kemantrens.map((item) => (
                            <option
                                key={item.id}
                                value={String(item.id)}
                            >
                                {item.nama}
                            </option>
                        ))}
                    </select>
                </div>

                {/* KELURAHAN */}
                <div className="min-w-[150px] flex-1">
                    <label className="mb-1 block text-xs text-gray-500">
                        Kelurahan
                    </label>

                    <select
                        value={kelurahan}
                        onChange={(e) =>
                            setKelurahan(e.target.value)
                        }
                        className="w-full rounded-md border-gray-300 text-sm focus:border-teal-500 focus:ring-teal-500"
                    >
                        <option value="">
                            Semua Kelurahan
                        </option>

                        {availableKelurahans.map((item) => (
                            <option
                                key={item.id}
                                value={String(item.id)}
                            >
                                {item.nama}
                            </option>
                        ))}
                    </select>
                </div>

                {/* TOMBOL APPLY */}
                <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-md bg-[#3F4452] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                    Apply Filter
                </button>

                {/* TOMBOL RESET */}
                <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                    Reset
                </button>

            </div>
        </div>
    );
}
