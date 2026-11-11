import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ auth, catins, kelurahans = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [kelurahanId, setKelurahanId] = useState(filters.kelurahan_id || '');
    const [statusRisiko, setStatusRisiko] = useState(filters.status_risiko || '');
    const [urutkan, setUrutkan] = useState(filters.urutkan || 'Terbaru');

    const handleFilter = () => {
        router.get('/catin', {
            search,
            kelurahan_id: kelurahanId,
            status_risiko: statusRisiko,
            urutkan,
        }, { preserveState: true, replace: true });
    };

    // Hitung total statistik
    const totalCount = catins?.total ?? catins?.data?.length ?? 0;
    const berisikoCount = catins?.data?.filter(c => c.status_risiko === 'berisiko').length ?? 0;
    const tidakBerisikoCount = catins?.data?.filter(c => c.status_risiko === 'tidak_berisiko').length ?? 0;

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Data Catin" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* 3 KARTU STATISTIK WIREFRAME GAMBAR 38 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Catin Terdaftar</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{totalCount}</h3>
                        <p className="text-xs text-gray-400 mt-1">Seluruh sasaran unik terdata</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">Total Beresiko</p>
                        <h3 className="text-3xl font-black text-brand-primary mt-1">{berisikoCount}</h3>
                        <p className="text-xs text-red-500 mt-1">Kasus terdeteksi berisiko</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Tidak Beresiko</p>
                        <h3 className="text-3xl font-black text-emerald-700 mt-1">{tidakBerisikoCount}</h3>
                        <p className="text-xs text-emerald-600 mt-1">Kasus terdeteksi tidak berisiko</p>
                    </div>
                </div>

                {/* KARTU PENCARIAN & TOMBOL + DATA BARU (SESUAI WIREFRAME) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Cari Nama Pasangan atau NIK..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFilter()}
                                className="w-full pl-10 rounded-xl text-sm border-gray-300 h-11 bg-gray-50/50 focus:bg-white"
                            />
                        </div>

                        {/* TOMBOL AKSI */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <button
                                type="button"
                                onClick={handleFilter}
                                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cari
                            </button>

                            <button
                                type="button"
                                className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5"
                            >
                                <span>Filter Lanjut</span>
                            </button>

                            {/* TOMBOL UTAMA + DATA BARU */}
                            <Link
                                href="/catin/create"
                                className="px-5 py-2.5 bg-[#3F4452] hover:bg-black text-white rounded-xl text-xs font-extrabold transition shadow flex items-center gap-1.5 shrink-0"
                            >
                                <span>+ Data Baru</span>
                            </Link>
                        </div>
                    </div>

                    {/* FILTER WILAYAH */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">KELURAHAN</label>
                            <select
                                value={kelurahanId}
                                onChange={e => { setKelurahanId(e.target.value); }}
                                className="w-full rounded-xl text-xs border-gray-300 h-10"
                            >
                                <option value="">Semua Kelurahan</option>
                                {kelurahans.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">TINGKAT RISIKO</label>
                            <select
                                value={statusRisiko}
                                onChange={e => { setStatusRisiko(e.target.value); }}
                                className="w-full rounded-xl text-xs border-gray-300 h-10"
                            >
                                <option value="">Semua Tingkat</option>
                                <option value="berisiko">Beresiko</option>
                                <option value="tidak_berisiko">Tidak Beresiko</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">URUTKAN</label>
                            <select
                                value={urutkan}
                                onChange={e => { setUrutkan(e.target.value); }}
                                className="w-full rounded-xl text-xs border-gray-300 h-10"
                            >
                                <option value="Terbaru">Terbaru</option>
                                <option value="Terlama">Terlama</option>
                                <option value="Nama A-Z">Nama A-Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* TABEL CATIN WIREFRAME */}
                <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-[#EEF3FF]">
                            <tr>
                                <th className="px-6 py-4 text-left font-black text-brand-complement text-xs uppercase">NO</th>
                                <th className="px-6 py-4 text-left font-black text-brand-complement text-xs uppercase">PASANGAN CATIN</th>
                                <th className="px-6 py-4 text-left font-black text-brand-complement text-xs uppercase">IDENTITAS (NIK)</th>
                                <th className="px-6 py-4 text-left font-black text-brand-complement text-xs uppercase">STATUS RISIKO</th>
                                <th className="px-6 py-4 text-left font-black text-brand-complement text-xs uppercase">AKSI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {!catins?.data || catins.data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                                        Belum ada data calon pengantin yang terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                catins.data.map((item, idx) => {
                                    const latest = item.kunjungans?.[0];
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/80 transition">
                                            <td className="px-6 py-4 font-bold text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-sm">{item.nama}</div>
                                                <div className="text-xs text-gray-500">Kel. {item.kelurahan?.nama ?? '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-600 text-xs">{item.nik}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    item.status_risiko === 'berisiko'
                                                        ? 'bg-red-50 text-brand-primary border border-red-200'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {item.status_risiko === 'berisiko' ? '▲ Beresiko' : '✓ Tidak Beresiko'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <Link href={`/catin/${item.id}`} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                                                        ✏️
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm('Yakin ingin menghapus data calon pengantin ini?')) {
                                                                router.delete(`/catin/${item.id}`);
                                                            }
                                                        }}
                                                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}