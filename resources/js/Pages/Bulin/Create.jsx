import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { TABEL_ACUAN_BULIN } from '@/Utils/rulesBulin';

export default function Create({ auth, kemantrens = [], kelurahans = [], tpkMembers = [], defaultKemantrenId, defaultKelurahanId }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSummary, setIsSummary] = useState(false);
    const [autofillBanner, setAutofillBanner] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        bulan_laporan: 'Oktober',
        tahun_laporan: '2026',
        tanggal_kunjungan: new Date().toISOString().split('T')[0],
        kemantren_id: defaultKemantrenId || '',
        kelurahan_id: defaultKelurahanId || '',
        tim_tpk: auth?.user?.name || '',
        tpk_member_id: '',
        nama_tpk: '',
        unsur_tpk: '',
        kunjungan_ke: 1,

        nik: '',
        nama: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        alamat: '',
        rt: '',
        rw: '',
        nomor_whatsapp: '',
        domisili_min_6_bulan: false,

        tanggal_persalinan: '',
        faskes_tempat_bersalin: '',
        nama_faskes: '',
        metode_persalinan: 'Spontan',
        komplikasi: 'Tidak',
        jenis_komplikasi: [],
        komplikasi_lainnya: '',
        kondisi_bayi: 'Sehat',

        paparan_asap_rokok: 'Tidak',
        sumber_paparan_asap_rokok: [],
        sumber_paparan_lainnya: '',
        mendapatkan_ttd: 'Ya',
        konsumsi_ttd: 'Ya',
        alasan_tidak_konsumsi_ttd: '',
        input_elsimil: 'Sudah',
        hasil_skrining_elsimil: 'Tidak Berisiko',
        unggah_screenshot_elsimil: null,

        menggunakan_kbpp: 'Ya',
        jenis_kbpp: 'Suntik KB',
        alasan_menggunakan_kbpp: 'Ingin Anak Tunda',
        alasan_tidak_kbpp: '',

        sumber_air_minum_utama: 'Ledeng/PAM',
        fasilitas_jamban: '1. Jamban milik sendiri dengan leher angsa & tangki septik/IPAL',
        unggah_foto_depan_rumah: null,
        unggah_foto_jamban: null,

        mendapatkan_mbg_3b: 'Tidak',
        mendapatkan_pmt: 'Tidak',
        sumber_pmt: '',
        fasilitasi_bantuan_sosial: 'Tidak, karena tidak memenuhi syarat',
        memberikan_penyuluhan: 'Ya, perorangan',
        penyuluhan_kie: '',
        fasilitasi_rujukan_faskes: 'Tidak',
        sasaran_mudah_ditemui: 'Ya',
        sasaran_kooperatif: 'Ya',
        catatan: '',

        tindak_lanjut_risiko: [],
    });

    const [detectedRisiko, setDetectedRisiko] = useState([]);

    const hitungUsia = (tglLahir) => {
        if (!tglLahir) return '';
        const today = new Date();
        const birthDate = new Date(tglLahir);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age > 0 ? `${age} tahun` : '0 tahun';
    };

    useEffect(() => {
        const risks = [];
        if (data.komplikasi === 'Ya') risks.push('Komplikasi');
        if (data.menggunakan_kbpp === 'Tidak') risks.push('Belum KBPP');
        if (data.fasilitas_jamban && !data.fasilitas_jamban.startsWith('1.')) risks.push('Sanitasi');

        const airTidakLayak = ['Sumur tidak terlindung', 'Mata air tidak terlindung', 'Air permukaan (sungai/danau/waduk/kolam/irigasi)', 'Air Hujan'];
        if (airTidakLayak.includes(data.sumber_air_minum_utama)) risks.push('Air Minum');

        if (['Operasi Caesar', 'Vacuum Extraction/Vakum', 'Curetase/Kuret'].includes(data.metode_persalinan)) {
            risks.push('Tindakan/Caesar');
        }

        setDetectedRisiko(risks);

        const currentTl = data.tindak_lanjut_risiko || [];
        const updatedTl = risks.map(r => {
            const existing = currentTl.find(item => item.faktor_risiko === r);
            return existing || { faktor_risiko: r, progres: 'Belum', tindak_lanjut: 'Belum dipastikan', alasan_belum_dilaksanakan: '' };
        });
        setData('tindak_lanjut_risiko', updatedTl);
    }, [data.komplikasi, data.menggunakan_kbpp, data.fasilitas_jamban, data.sumber_air_minum_utama, data.metode_persalinan]);

    const handleNikInput = (val) => {
        const sanitized = val.replace(/\D/g, '').slice(0, 16);
        setData('nik', sanitized);

        if (sanitized.length === 16) {
            fetch(`/bulin/check-nik?nik=${sanitized}`)
                .then(res => res.json())
                .then(res => {
                    if (res.found) setAutofillBanner(res);
                    else setAutofillBanner(null);
                });
        } else {
            setAutofillBanner(null);
        }
    };

    const applyAutofill = () => {
        if (!autofillBanner) return;
        const m = autofillBanner.master;
        const p = autofillBanner.persalinan;

        setData(prev => ({
            ...prev,
            nama: m.nama,
            tempat_lahir: m.tempat_lahir || '',
            tanggal_lahir: m.tanggal_lahir,
            alamat: m.alamat,
            rt: m.rt,
            rw: m.rw,
            nomor_whatsapp: m.nomor_whatsapp || '',
            kunjungan_ke: autofillBanner.kunjungan_ke,
            tanggal_persalinan: p?.tanggal_persalinan || prev.tanggal_persalinan,
            faskes_tempat_bersalin: p?.faskes_tempat_bersalin || prev.faskes_tempat_bersalin,
            nama_faskes: p?.nama_faskes || prev.nama_faskes,
            metode_persalinan: p?.metode_persalinan || prev.metode_persalinan,
            kondisi_bayi: p?.kondisi_bayi || prev.kondisi_bayi,
            sumber_air_minum_utama: p?.sumber_air_minum_utama || prev.sumber_air_minum_utama,
            fasilitas_jamban: p?.fasilitas_jamban || prev.fasilitas_jamban,
        }));
        setAutofillBanner(null);
    };

    const handleCheckboxMulti = (field, value) => {
        const current = data[field] || [];
        if (current.includes(value)) {
            setData(field, current.filter(item => item !== value));
        } else {
            setData(field, [...current, value]);
        }
    };

    const validateStep = () => {
        if (currentStep === 1) {
            if (!data.kemantren_id || !data.kelurahan_id) {
                alert('Pilih Kemantren dan Kelurahan terlebih dahulu.');
                return false;
            }
        }
        if (currentStep === 2) {
            if (data.nik.length !== 16) {
                alert('NIK wajib 16 digit angka.');
                return false;
            }
            if (!data.nama || !data.tanggal_lahir || !data.alamat) {
                alert('Lengkapi nama, tanggal lahir, dan alamat.');
                return false;
            }
            if (!data.domisili_min_6_bulan) {
                alert('Sasaran di luar Kota Yogyakarta (mis. warga Sleman atau Bantul) tidak didata di aplikasi ini.');
                return false;
            }
        }
        if (currentStep === 3) {
            if (!data.tanggal_persalinan || !data.faskes_tempat_bersalin || !data.nama_faskes) {
                alert('Lengkapi data tanggal persalinan, jenis faskes, dan nama faskes.');
                return false;
            }
            if (data.paparan_asap_rokok === 'Pasif' && data.sumber_paparan_asap_rokok.length === 0) {
                alert('Pilih minimal satu sumber paparan asap rokok.');
                return false;
            }
            if (data.komplikasi === 'Ya' && data.jenis_komplikasi.length === 0) {
                alert('Pilih minimal satu jenis komplikasi nifas.');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (!validateStep()) return;
        if (currentStep === 4) setIsSummary(true);
        else setCurrentStep(prev => prev + 1);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('bulin.store'), { forceFormData: true });
    };

    const steps = [
        { no: 1, title: 'Wilayah' },
        { no: 2, title: 'Data Diri Ibu' },
        { no: 3, title: 'Persalinan & KBPP' },
        { no: 4, title: 'Lingkungan & Tindak Lanjut' },
    ];

    const selectedKemantren = kemantrens.find(k => k.id === data.kemantren_id);
    const selectedKelurahan = kelurahans.find(k => k.id === data.kelurahan_id);

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Pendaftaran Bulin" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* PROGRESS BAR CONTAINER PUTIH BERSIH */}
                <div className="bg-white p-6 rounded-2xl border-2 border-[#8cc7c4] shadow-sm">
                    <div className="flex justify-between items-center">
                        {steps.map((s) => {
                            const isCurrent = currentStep === s.no && !isSummary;
                            const isPassed = currentStep > s.no || isSummary;

                            return (
                                <div key={s.no} className="flex flex-col items-center flex-1 text-center">
                                    <div
                                        className={`w-11 h-11 flex items-center justify-center rounded-full font-black text-sm transition-all duration-300 shadow ${
                                            isCurrent
                                                ? 'bg-brand-complement text-white ring-4 ring-[#8cc7c4]/50 scale-110'
                                                : isPassed
                                                ? 'bg-[#8cc7c4] text-brand-complement font-extrabold'
                                                : 'bg-brand-secondary text-gray-400 border-2 border-[#8cc7c4]/60'
                                        }`}
                                    >
                                        {isPassed ? '✓' : s.no}
                                    </div>
                                    <span
                                        className={`text-xs mt-2.5 font-bold hidden md:block ${
                                            isCurrent
                                                ? 'text-brand-complement'
                                                : isPassed
                                                ? 'text-[#2c687b]/80'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {s.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full bg-[#8cc7c4]/25 h-3 rounded-full overflow-hidden mt-5 border border-[#8cc7c4]">
                        <div
                            className="bg-brand-complement h-full transition-all duration-300"
                            style={{ width: `${isSummary ? 100 : ((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* BANNER AUTOFILL */}
                {autofillBanner && (
                    <div className="p-4 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between text-sky-900 shadow-sm">
                        <div>
                            <p className="font-bold text-sm">
                                Data ditemukan: {autofillBanner.master.nama} (Kunjungan ke-{autofillBanner.kunjungan_ke})
                            </p>
                            <p className="text-xs text-sky-700">
                                Isi otomatis data profil ibu yang tidak berubah antar kunjungan?
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={applyAutofill}
                                className="px-4 py-1.5 bg-[#2c687b] text-white rounded-lg text-xs font-bold hover:bg-[#204c5a]"
                            >
                                Isi Otomatis
                            </button>
                            <button
                                type="button"
                                onClick={() => setAutofillBanner(null)}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                            >
                                Abaikan
                            </button>
                        </div>
                    </div>
                )}

                {/* FORMULIR UTAMA: BORDER 2 TEAL RAPI, LATAR PUTIH */}
                <form onSubmit={submit} className="bg-white rounded-2xl border-2 border-[#8cc7c4] shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 space-y-6">
                        {!isSummary ? (
                            <>
                                {/* TAHAP 1: WILAYAH */}
                                {currentStep === 1 && (
                                    <div className="space-y-5">
                                        <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-brand-complement">
                                                    Langkah 1: Wilayah Binaan & Data Penugasan
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Penugasan wilayah kerja kader dan pencatatan identitas tim pendamping.
                                                </p>
                                            </div>
                                            <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                                Data Dasar
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kemantren *</label>
                                                <select
                                                    value={data.kemantren_id}
                                                    onChange={e => setData(prev => ({ ...prev, kemantren_id: e.target.value, kelurahan_id: '' }))}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="">-- Pilih Kemantren --</option>
                                                    {kemantrens.map(k => (
                                                        <option key={k.id} value={k.id}>{k.nama}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kelurahan *</label>
                                                <select
                                                    value={data.kelurahan_id}
                                                    disabled={!data.kemantren_id}
                                                    onChange={e => setData('kelurahan_id', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12 disabled:bg-gray-100"
                                                >
                                                    <option value="">-- Pilih Kelurahan --</option>
                                                    {kelurahans.filter(k => k.kemantren_id === data.kemantren_id).map(k => (
                                                        <option key={k.id} value={k.id}>{k.nama}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Bulan Laporan *</label>
                                                <select
                                                    value={data.bulan_laporan}
                                                    onChange={e => setData('bulan_laporan', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => (
                                                        <option key={b} value={b}>{b}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Tahun Laporan *</label>
                                                <select
                                                    value={data.tahun_laporan}
                                                    onChange={e => setData('tahun_laporan', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="2026">2026</option>
                                                    <option value="2025">2025</option>
                                                    <option value="2024">2024</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Kunjungan *</label>
                                                <input
                                                    type="date"
                                                    value={data.tanggal_kunjungan}
                                                    onChange={e => setData('tanggal_kunjungan', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Anggota Tim TPK yang Bertugas *</label>
                                                <select
                                                    value={data.tpk_member_id}
                                                    onChange={e => {
                                                        const m = tpkMembers.find(item => String(item.id) === String(e.target.value));
                                                        setData(prev => ({
                                                            ...prev,
                                                            tpk_member_id: e.target.value,
                                                            nama_tpk: m ? m.nama_anggota : '',
                                                            unsur_tpk: m ? m.unsur : '',
                                                        }));
                                                    }}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="">-- Pilih Anggota Tim Lapangan --</option>
                                                    {tpkMembers.map(m => (
                                                        <option key={m.id} value={m.id}>{m.nama_anggota} ({m.unsur})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-2 border-2 border-dashed border-[#8cc7c4] bg-[#EEF3FF] rounded-xl flex items-center justify-center p-4 text-center">
                                                {selectedKemantren && selectedKelurahan ? (
                                                    <div>
                                                        <p className="font-extrabold text-[#2c687b] text-sm">
                                                            {selectedKemantren.nama} / {selectedKelurahan.nama}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                                            Kode Wilayah: {selectedKelurahan.id}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400 text-xs font-medium flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                        </svg>
                                                        <span>--------------------</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAHAP 2: DATA DIRI */}
                                {currentStep === 2 && (
                                    <div className="space-y-5">
                                        <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-brand-complement">
                                                    Langkah 2: Data Diri Ibu Bersalin
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Biodata lengkap ibu pasca persalinan sesuai kartu identitas resmi.
                                                </p>
                                            </div>
                                            <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                                Data Diri
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">NIK (16 Digit Angka) *</label>
                                                <input
                                                    type="text"
                                                    value={data.nik}
                                                    onChange={e => handleNikInput(e.target.value)}
                                                    placeholder="3471xxxxxxxxxxxx"
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                                <span className="text-[11px] font-bold text-[#2c687b] mt-1 block">
                                                    Status: {data.nik.length} / 16 Digit
                                                </span>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Sesuai KTP *</label>
                                                <input
                                                    type="text"
                                                    value={data.nama}
                                                    onChange={e => setData('nama', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Tempat Lahir</label>
                                                <input
                                                    type="text"
                                                    value={data.tempat_lahir}
                                                    onChange={e => setData('tempat_lahir', e.target.value)}
                                                    placeholder="cth: Yogyakarta"
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir *</label>
                                                <input
                                                    type="date"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    value={data.tanggal_lahir}
                                                    onChange={e => setData('tanggal_lahir', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                                {data.tanggal_lahir && (
                                                    <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                                                        Usia: {hitungUsia(data.tanggal_lahir)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili (Jalan/Gang, No Rumah) *</label>
                                                <textarea
                                                    rows="2"
                                                    value={data.alamat}
                                                    onChange={e => setData('alamat', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300"
                                                ></textarea>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">RT / RW *</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="RT (Angka)"
                                                        value={data.rt}
                                                        onChange={e => setData('rt', e.target.value.replace(/\D/g, ''))}
                                                        className="w-1/2 rounded-xl text-sm border-gray-300 h-12"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="RW (Angka)"
                                                        value={data.rw}
                                                        onChange={e => setData('rw', e.target.value.replace(/\D/g, ''))}
                                                        className="w-1/2 rounded-xl text-sm border-gray-300 h-12"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                                                <input
                                                    type="text"
                                                    value={data.nomor_whatsapp}
                                                    onChange={e => setData('nomor_whatsapp', e.target.value.replace(/\D/g, ''))}
                                                    placeholder="08xxxxxxxxxx"
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                            </div>

                                            <div className="md:col-span-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                                <label className="flex items-center gap-2 text-xs font-bold text-red-900 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.domisili_min_6_bulan}
                                                        onChange={e => setData('domisili_min_6_bulan', e.target.checked)}
                                                        className="rounded text-brand-primary"
                                                    />
                                                    <span>Sasaran berdomisili di Kota Yogyakarta minimal 6 bulan (termasuk sewa/kos) *</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAHAP 3: PERSALINAN & KBPP */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-brand-complement">
                                                    Langkah 3: Persalinan, Kesehatan & KB Pascapersalinan
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Rincian persalinan, evaluasi komplikasi masa nifas, dan komitmen KBPP.
                                                </p>
                                            </div>
                                            <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                                Persalinan
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Persalinan *</label>
                                                <input
                                                    type="date"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    value={data.tanggal_persalinan}
                                                    onChange={e => setData('tanggal_persalinan', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Fasilitas Tempat Bersalin *</label>
                                                <select
                                                    value={data.faskes_tempat_bersalin}
                                                    onChange={e => setData(prev => ({ ...prev, faskes_tempat_bersalin: e.target.value, nama_faskes: '' }))}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="">-- Pilih Jenis Faskes --</option>
                                                    <option value="Rumah Sakit">Rumah Sakit</option>
                                                    <option value="Puskesmas">Puskesmas</option>
                                                    <option value="Klinik">Klinik</option>
                                                    <option value="Bidan">Bidan</option>
                                                </select>
                                            </div>

                                            {data.faskes_tempat_bersalin && (
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Faskes *</label>
                                                    <input
                                                        type="text"
                                                        value={data.nama_faskes}
                                                        onChange={e => setData('nama_faskes', e.target.value)}
                                                        placeholder="cth: RS PKU Muhammadiyah / Puskesmas Mergangsan"
                                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Metode Persalinan *</label>
                                                <select
                                                    value={data.metode_persalinan}
                                                    onChange={e => setData('metode_persalinan', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="Spontan">Spontan</option>
                                                    <option value="Operasi Caesar">Operasi Caesar</option>
                                                    <option value="Curetase/Kuret">Curetase/Kuret</option>
                                                    <option value="Vacuum Extraction/Vakum">Vacuum Extraction/Vakum</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Kondisi Bayi *</label>
                                                <select
                                                    value={data.kondisi_bayi}
                                                    onChange={e => setData('kondisi_bayi', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="Sehat">Sehat</option>
                                                    <option value="Meninggal">Meninggal</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Komplikasi Masa Nifas *</label>
                                                <select
                                                    value={data.komplikasi}
                                                    onChange={e => setData(prev => ({ ...prev, komplikasi: e.target.value, jenis_komplikasi: [] }))}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="Tidak">Tidak</option>
                                                    <option value="Ya">Ya</option>
                                                </select>
                                            </div>

                                            {data.komplikasi === 'Ya' && (
                                                <div className="md:col-span-2 p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
                                                    <label className="block text-xs font-bold text-red-900">
                                                        Pilih Jenis Komplikasi (Berdasarkan Diagnosa Dokter):
                                                    </label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                                        {['Pendarahan', 'Infeksi', 'Mastitis', 'Lainnya'].map(item => (
                                                            <label key={item} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-red-200">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={data.jenis_komplikasi.includes(item)}
                                                                    onChange={() => handleCheckboxMulti('jenis_komplikasi', item)}
                                                                    className="rounded text-brand-primary"
                                                                />
                                                                <span>{item}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Paparan Asap Rokok *</label>
                                                <select
                                                    value={data.paparan_asap_rokok}
                                                    onChange={e => setData(prev => ({ ...prev, paparan_asap_rokok: e.target.value, sumber_paparan_asap_rokok: [] }))}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="Tidak">Tidak</option>
                                                    <option value="Pasif">Pasif (Terpapar asap rokok orang lain)</option>
                                                    <option value="Aktif">Aktif (Ibu sendiri merokok)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Mendapatkan Tablet Tambah Darah (TTD) *</label>
                                                <select
                                                    value={data.mendapatkan_ttd}
                                                    onChange={e => setData('mendapatkan_ttd', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="Ya">Ya</option>
                                                    <option value="Tidak">Tidak</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Konsumsi TTD Dipastikan? *</label>
                                                <select
                                                    value={data.konsumsi_ttd}
                                                    onChange={e => setData('konsumsi_ttd', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="Ya">Ya</option>
                                                    <option value="Tidak">Tidak</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Menggunakan KB Pascapersalinan (KBPP) *</label>
                                                <select
                                                    value={data.menggunakan_kbpp}
                                                    onChange={e => setData('menggunakan_kbpp', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="Ya">Ya</option>
                                                    <option value="Tidak">Tidak</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAHAP 4: LINGKUNGAN & TINDAK LANJUT */}
                                {currentStep === 4 && (
                                    <div className="space-y-6">
                                        <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-brand-complement">
                                                    Langkah 4: Lingkungan Tempat Tinggal & Tindak Lanjut
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Kelayakan sanitasi rumah, fasilitas bantuan, dan pemenuhan tindak lanjut risiko.
                                                </p>
                                            </div>
                                            <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                                Sanitasi & Intervensi
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Sumber Air Minum Utama *</label>
                                                <select
                                                    value={data.sumber_air_minum_utama}
                                                    onChange={e => setData('sumber_air_minum_utama', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    {['Air Kemasan/isi ulang', 'Ledeng/PAM', 'Sumur bor/pompa', 'Sumur terlindung', 'Sumur tidak terlindung', 'Mata air terlindung', 'Mata air tidak terlindung', 'Air permukaan (sungai/danau/waduk/kolam/irigasi)', 'Air Hujan'].map(o => (
                                                        <option key={o} value={o}>{o}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Fasilitas Tempat Buang Air Besar / Jamban *</label>
                                                <select
                                                    value={data.fasilitas_jamban}
                                                    onChange={e => setData('fasilitas_jamban', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    {[
                                                        '1. Jamban milik sendiri dengan leher angsa & tangki septik/IPAL',
                                                        '2. Jamban MCK Komunal dengan leher angsa & tangki septik/IPAL',
                                                        '3. Jamban milik sendiri tidak leher angsa dengan tangki septik/IPAL',
                                                        '4. Jamban MCK Komunal tidak leher angsa dengan tangki septik/IPAL',
                                                        '5. Jamban milik sendiri dengan leher angsa tanpa tangki septik/IPAL',
                                                        '6. Jamban MCK Komunal dengan leher angsa tanpa tangki septik/IPAL',
                                                        '7. Jamban milik sendiri tanpa leher angsa & tanpa tangki septik/IPAL',
                                                        '8. Jamban MCK Komunal tanpa leher angsa & tanpa tangki septik/IPAL',
                                                    ].map(j => (
                                                        <option key={j} value={j}>{j}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Unggah Foto Rumah (Maks 5MB)</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => setData('unggah_foto_depan_rumah', e.target.files[0])}
                                                    className="w-full text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Unggah Foto Jamban (Maks 5MB)</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => setData('unggah_foto_jamban', e.target.files[0])}
                                                    className="w-full text-xs"
                                                />
                                            </div>
                                        </div>

                                        {/* KARTU PENDAMPINGAN RISIKO */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <h4 className="text-sm font-black text-gray-900 mb-3">
                                                Rencana Pendampingan Lanjutan ({detectedRisiko.length} Faktor Risiko Terdeteksi)
                                            </h4>

                                            {detectedRisiko.length === 0 ? (
                                                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-300 font-semibold text-xs">
                                                    ✓ Tidak ada faktor risiko terdeteksi pada sasaran ini.
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {detectedRisiko.map(riskName => {
                                                        const acuan = TABEL_ACUAN_BULIN[riskName] || {};
                                                        const current = data.tindak_lanjut_risiko.find(item => item.faktor_risiko === riskName) || {};

                                                        return (
                                                            <div key={riskName} className="p-4 bg-[#EEF3FF] rounded-xl border border-[#8cc7c4] space-y-2 text-xs">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-bold text-[#2c687b]">{riskName}</span>
                                                                    <span className="bg-red-100 text-brand-primary px-2 py-0.5 rounded font-black text-[10px]">
                                                                        Wajib Ditindaklanjuti
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700"><strong>Intervensi:</strong> {acuan.intervensi}</p>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                                    <div>
                                                                        <label className="block font-bold text-gray-700">{acuan.progresTeks || 'Progres'}</label>
                                                                        <select
                                                                            value={current.progres || 'Belum'}
                                                                            onChange={e => {
                                                                                const updated = data.tindak_lanjut_risiko.map(item => item.faktor_risiko === riskName ? { ...item, progres: e.target.value } : item);
                                                                                setData('tindak_lanjut_risiko', updated);
                                                                            }}
                                                                            className="w-full rounded-lg text-xs mt-1"
                                                                        >
                                                                            <option value="Sudah">Sudah</option>
                                                                            <option value="Belum">Belum</option>
                                                                        </select>
                                                                    </div>

                                                                    {acuan.tindakLanjutTeks && (
                                                                        <div>
                                                                            <label className="block font-bold text-gray-700">{acuan.tindakLanjutTeks}</label>
                                                                            <select
                                                                                value={current.tindak_lanjut || 'Belum dipastikan'}
                                                                                onChange={e => {
                                                                                    const updated = data.tindak_lanjut_risiko.map(item => item.faktor_risiko === riskName ? { ...item, tindak_lanjut: e.target.value } : item);
                                                                                    setData('tindak_lanjut_risiko', updated);
                                                                                }}
                                                                                className="w-full rounded-lg text-xs mt-1"
                                                                            >
                                                                                <option value="Sudah dipastikan">Sudah dipastikan</option>
                                                                                <option value="Belum dipastikan">Belum dipastikan</option>
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* LAYAR RINGKASAN */
                            <div className="space-y-5">
                                <div className="border-b pb-3 flex justify-between items-center">
                                    <h3 className="text-lg font-black text-gray-900">Tinjau Ringkasan Data Bulin</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${detectedRisiko.length > 0 ? 'bg-red-100 text-brand-primary' : 'bg-emerald-100 text-emerald-800'}`}>
                                        Status: {detectedRisiko.length > 0 ? 'Berisiko' : 'Tidak Berisiko'}
                                    </span>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border text-xs space-y-1">
                                    <p><strong>NIK / Nama:</strong> {data.nik} - {data.nama}</p>
                                    <p><strong>Persalinan:</strong> {data.tanggal_persalinan} ({data.metode_persalinan} di {data.nama_faskes})</p>
                                    <p><strong>Komplikasi:</strong> {data.komplikasi} | <strong>Kondisi Bayi:</strong> {data.kondisi_bayi}</p>
                                    <p><strong>KBPP:</strong> {data.menggunakan_kbpp === 'Ya' ? data.jenis_kbpp : 'Tidak'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BARIS TOMBOL AKSI */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex gap-2">
                            <Link
                                href="/bulin"
                                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                            >
                                ✕ Batal
                            </Link>

                            {currentStep > 1 && !isSummary && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                                >
                                    ← Sebelumnya
                                </button>
                            )}
                        </div>

                        {!isSummary ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-2.5 bg-[#3F4452] text-white rounded-xl text-xs font-extrabold hover:bg-black transition shadow"
                            >
                                {currentStep === 4 ? 'Tinjau Ringkasan →' : 'Selanjutnya →'}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-7 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black hover:bg-red-700 transition shadow-lg disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'SIMPAN DATA BULIN'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}