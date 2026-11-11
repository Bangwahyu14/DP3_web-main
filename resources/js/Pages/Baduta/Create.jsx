import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { TABEL_ACUAN_BADUTA } from '@/Utils/rulesBaduta';

export default function Create({ auth, kemantrens = [], kelurahans = [], tpkMembers = [], defaultKemantrenId, defaultKelurahanId }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSummary, setIsSummary] = useState(false);
    const [autofillBanner, setAutofillBanner] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        // Tahap 1 - Wilayah
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

        // Tahap 2 - Data Orang Tua (Ibu)
        nik_ibu: '',
        nama_ibu: '',
        tanggal_lahir_ibu: '',
        nomor_whatsapp_ibu: '',
        alamat: '',
        rt: '',
        rw: '',
        domisili_min_6_bulan: false,
        penggunaan_kontrasepsi: 'Ya',
        metode_kb: 'Suntik KB',
        alasan_tidak_kb: '',

        // Tahap 3 - Data Anak
        nik_anak: '',
        nama_anak: '',
        tanggal_lahir_anak: '',
        jenis_kelamin_anak: 'Laki-laki',
        anak_ke: 1,
        tanggal_lahir_anak_sebelumnya: '',
        pemberian_asi: 'ASI Eksklusif',
        riwayat_asi_setelah_6_bulan: '',

        // Tahap 4 - Kondisi Bayi Baru Lahir
        usia_kehamilan_saat_lahir: 38,
        berat_badan_lahir: 3.1,
        panjang_badan_lahir: 49.0,
        lingkar_kepala_lahir: 34.0,
        mengalami_asfiksia: 'Tidak',

        // Tahap 5 - Kondisi Baduta Saat Ini
        tanggal_pengukuran: new Date().toISOString().split('T')[0],
        berat_badan_saat_ini: '',
        panjang_badan_saat_ini: '',
        lingkar_kepala_saat_ini: '',
        berat_badan_bulan_lalu: '',
        tinggi_badan_bulan_lalu: '',
        lingkar_kepala_bulan_lalu: '',

        zscore_bb_u: '',
        zscore_tb_u: '',
        zscore_bb_tb: '',

        mengisi_kka: 'Ya',
        imunisasi_dasar_lengkap: 'Lengkap (selesai), sesuai jadwal',
        alasan_imunisasi_tidak_lengkap: '',
        kehadiran_posyandu_bkb: 'Ya',
        paparan_asap_rokok: 'Tidak',
        sumber_paparan_asap_rokok: [],
        sumber_paparan_lainnya: '',

        mendapatkan_mbg_3b: 'Tidak',
        mendapatkan_pmt: 'Tidak',
        sumber_pmt: '',
        lama_menerima_pmt_hari: '',
        progres_setelah_pmt: [],
        input_elsimil: 'Sudah',
        hasil_skrining_elsimil: 'Tidak Berisiko',
        unggah_screenshot_elsimil: null,

        // Tahap 6 - Lingkungan & Tindak Lanjut
        sumber_air_minum_utama: 'Ledeng/PAM',
        fasilitas_jamban: '1. Jamban milik sendiri dengan leher angsa & tangki septik/IPAL',
        unggah_foto_depan_rumah: null,
        unggah_foto_jamban: null,

        fasilitasi_bantuan_sosial: 'Tidak, karena tidak memenuhi syarat',
        menerima_bantuan_sanitasi: 'Tidak',
        sumber_bantuan_sanitasi: '',
        sumber_bantuan_sanitasi_lainnya: '',
        nilai_bantuan_sanitasi: '',
        memberikan_penyuluhan: 'Ya, perorangan',
        penyuluhan_kie: '',
        fasilitasi_rujukan_faskes: 'Tidak',
        sasaran_mudah_ditemui: 'Ya',
        sasaran_kooperatif: 'Ya',
        catatan: '',

        tindak_lanjut_risiko: [],
    });

    const [detectedRisiko, setDetectedRisiko] = useState([]);

    // Kalkulasi Usia Anak dalam Bulan & Hari[cite: 60]
    const hitungDetailUsiaAnak = () => {
        if (!data.tanggal_lahir_anak) return { bulan: 0, hari: 0, label: '-' };
        const birth = new Date(data.tanggal_lahir_anak);
        const ref = data.tanggal_pengukuran ? new Date(data.tanggal_pengukuran) : new Date();
        const diffDays = Math.floor((ref - birth) / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30.4375);

        let label = `${diffDays} hari`;
        if (diffMonths >= 1) {
            const sisaHari = Math.floor(diffDays % 30.4375);
            label = `${diffMonths} bulan ${sisaHari > 0 ? sisaHari + ' hari' : ''}`;
        }
        return { bulan: Math.max(0, diffMonths), hari: Math.max(0, diffDays), label };
    };

    const usiaAnak = hitungDetailUsiaAnak();
    const kriteriaBaduta = usiaAnak.hari <= 28 ? 'Bayi baru lahir (0-28 hari)' : 'Baduta (28 hari-23 bulan)';

    // Perhitungan Aproksimasi Z-score Standar WHO 2006[cite: 60]
    useEffect(() => {
        if (!data.berat_badan_saat_ini || !data.panjang_badan_saat_ini || !data.tanggal_lahir_anak) return;

        const isBoy = data.jenis_kelamin_anak === 'Laki-laki';
        const m = Math.max(1, usiaAnak.bulan);
        const bb = parseFloat(data.berat_badan_saat_ini);
        const tb = parseFloat(data.panjang_badan_saat_ini);

        // Median Referensi WHO
        const medianBb = isBoy ? (3.3 + (m * 0.5)) : (3.2 + (m * 0.48));
        const medianTb = isBoy ? (50.0 + (m * 1.8)) : (49.0 + (m * 1.75));

        const zBbU = ((bb - medianBb) / (medianBb * 0.12)).toFixed(2);
        const zTbU = ((tb - medianTb) / (medianTb * 0.04)).toFixed(2);
        const zBbTb = ((bb / (tb * 0.12)) - 1.0).toFixed(2);

        setData(prev => ({
            ...prev,
            zscore_bb_u: zBbU,
            zscore_tb_u: zTbU,
            zscore_bb_tb: zBbTb,
        }));
    }, [data.berat_badan_saat_ini, data.panjang_badan_saat_ini, data.tanggal_lahir_anak, data.jenis_kelamin_anak]);

    // Deteksi Otomatis Faktor Risiko Baduta[cite: 60]
    useEffect(() => {
        const risks = [];
        if (parseFloat(data.berat_badan_lahir) > 0 && parseFloat(data.berat_badan_lahir) < 2.5) {
            risks.push('Bayi baru lahir - BBLR');
        }
        if (parseFloat(data.panjang_badan_lahir) > 0 && parseFloat(data.panjang_badan_lahir) < 48.0) {
            risks.push('Bayi baru lahir - Panjang < 48cm');
        }
        if (parseInt(data.usia_kehamilan_saat_lahir) > 0 && parseInt(data.usia_kehamilan_saat_lahir) < 37) {
            risks.push('Bayi baru lahir - Kurang Bulan');
        }
        if (data.penggunaan_kontrasepsi === 'Tidak') {
            risks.push('Ibu belum ber-KB');
        }

        if (data.zscore_tb_u && parseFloat(data.zscore_tb_u) < -1.0) risks.push('Risiko TB/U (<-1 SD)');
        if (data.zscore_bb_u && parseFloat(data.zscore_bb_u) < -1.0) risks.push('Risiko BB/U (<-1 SD)');
        if (data.zscore_bb_tb && parseFloat(data.zscore_bb_tb) < -1.0) risks.push('Risiko BB/TB (<-1 SD)');

        if (data.fasilitas_jamban && !data.fasilitas_jamban.startsWith('1.')) risks.push('Sanitasi');

        const airTidakLayak = ['Sumur tidak terlindung', 'Mata air tidak terlindung', 'Air permukaan (sungai/danau/waduk/kolam/irigasi)', 'Air Hujan'];
        if (airTidakLayak.includes(data.sumber_air_minum_utama)) risks.push('Air Minum');

        setDetectedRisiko(risks);

        const currentTl = data.tindak_lanjut_risiko || [];
        const updatedTl = risks.map(r => {
            const existing = currentTl.find(item => item.faktor_risiko === r);
            return existing || { faktor_risiko: r, identifikasi_penyebab: [], progres: 'Belum', tindak_lanjut: 'Belum dipastikan', alasan_belum_dilaksanakan: '' };
        });
        setData('tindak_lanjut_risiko', updatedTl);
    }, [data.berat_badan_lahir, data.panjang_badan_lahir, data.usia_kehamilan_saat_lahir, data.penggunaan_kontrasepsi, data.zscore_tb_u, data.zscore_bb_u, data.zscore_bb_tb, data.fasilitas_jamban, data.sumber_air_minum_utama]);

    const handleNikAnakInput = (val) => {
        const sanitized = val.replace(/\D/g, '').slice(0, 16);
        setData('nik_anak', sanitized);

        if (sanitized.length === 16) {
            fetch(`/baduta/check-nik?nik=${sanitized}`)
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
        const l = autofillBanner.latest;

        setData(prev => ({
            ...prev,
            nama_anak: m.nama_anak,
            tanggal_lahir_anak: m.tanggal_lahir_anak,
            jenis_kelamin_anak: m.jenis_kelamin_anak,
            anak_ke: m.anak_ke,
            tanggal_lahir_anak_sebelumnya: m.tanggal_lahir_anak_sebelumnya || '',
            nik_ibu: m.nik_ibu,
            nama_ibu: m.nama_ibu,
            tanggal_lahir_ibu: m.tanggal_lahir_ibu,
            nomor_whatsapp_ibu: m.nomor_whatsapp_ibu || '',
            alamat: m.alamat,
            rt: m.rt,
            rw: m.rw,
            kunjungan_ke: autofillBanner.kunjungan_ke,
            berat_badan_bulan_lalu: l?.berat_badan_saat_ini || '',
            tinggi_badan_bulan_lalu: l?.panjang_badan_saat_ini || '',
            lingkar_kepala_bulan_lalu: l?.lingkar_kepala_saat_ini || '',
            usia_kehamilan_saat_lahir: l?.usia_kehamilan_saat_lahir || prev.usia_kehamilan_saat_lahir,
            berat_badan_lahir: l?.berat_badan_lahir || prev.berat_badan_lahir,
            panjang_badan_lahir: l?.panjang_badan_lahir || prev.panjang_badan_lahir,
            lingkar_kepala_lahir: l?.lingkar_kepala_lahir || prev.lingkar_kepala_lahir,
            mengalami_asfiksia: l?.mengalami_asfiksia || prev.mengalami_asfiksia,
            sumber_air_minum_utama: l?.sumber_air_minum_utama || prev.sumber_air_minum_utama,
            fasilitas_jamban: l?.fasilitas_jamban || prev.fasilitas_jamban,
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
        if (currentStep === 1 && (!data.kemantren_id || !data.kelurahan_id)) {
            alert('Pilih Kemantren dan Kelurahan terlebih dahulu.');
            return false;
        }
        if (currentStep === 2) {
            if (data.nik_ibu.length !== 16) {
                alert('NIK Ibu wajib 16 digit angka.');
                return false;
            }
            if (!data.nama_ibu || !data.tanggal_lahir_ibu || !data.alamat) {
                alert('Lengkapi identitas ibu dan alamat.');
                return false;
            }
            if (!data.domisili_min_6_bulan) {
                alert('Sasaran di luar Kota Yogyakarta tidak didata di aplikasi ini. Centang konfirmasi domisili.');
                return false;
            }
        }
        if (currentStep === 3) {
            if (data.nik_anak.length !== 16) {
                alert('NIK Anak wajib 16 digit angka.');
                return false;
            }
            if (data.nik_anak === data.nik_ibu) {
                alert('NIK Anak dan NIK Ibu tidak boleh sama.');
                return false;
            }
            if (!data.nama_anak || !data.tanggal_lahir_anak) {
                alert('Lengkapi nama dan tanggal lahir anak.');
                return false;
            }
            // Validasi batas umur baduta maksimal 24 bulan[cite: 60]
            if (usiaAnak.bulan > 24) {
                alert('Baduta berusia maksimal 23 bulan. Periksa kembali, apakah ini tanggal lahir ibu?');
                return false;
            }
        }
        if (currentStep === 4) {
            if (!data.berat_badan_lahir || !data.panjang_badan_lahir || !data.lingkar_kepala_lahir) {
                alert('Lengkapi seluruh kondisi bayi baru lahir.');
                return false;
            }
        }
        if (currentStep === 5) {
            if (!data.berat_badan_saat_ini || !data.panjang_badan_saat_ini || !data.lingkar_kepala_saat_ini) {
                alert('Lengkapi hasil pengukuran baduta saat ini.');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (!validateStep()) return;
        if (currentStep === 6) setIsSummary(true);
        else setCurrentStep(prev => prev + 1);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('baduta.store'), { forceFormData: true });
    };

    const steps = [
        { no: 1, title: 'Wilayah' },
        { no: 2, title: 'Orang Tua' },
        { no: 3, title: 'Data Anak' },
        { no: 4, title: 'Kondisi BBL' },
        { no: 5, title: 'Kondisi Baduta' },
        { no: 6, title: 'Tindak Lanjut' },
    ];

    const selectedKemantren = kemantrens.find(k => k.id === data.kemantren_id);
    const selectedKelurahan = kelurahans.find(k => k.id === data.kelurahan_id);

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Pendaftaran Baduta" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* BREADCRUMB */}
                <div className="text-xs font-semibold text-gray-500">
                    Form Pendataan &gt;{' '}
                    <span className="text-[#2c687b] font-bold">
                        {isSummary ? 'Tinjau Ringkasan' : steps[currentStep - 1]?.title}
                    </span>
                </div>

                {/* HEADER FORM */}
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        Pendaftaran Baduta (Anak Bawah 2 Tahun)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {currentStep === 1 && 'Lengkapi informasi kelengkapan wilayah penugasan'}
                        {currentStep === 2 && 'Biodata orang tua (ibu) dan kesertaan keluarga berencana'}
                        {currentStep === 3 && 'Identitas anak, urutan kelahiran, dan pola pemberian ASI'}
                        {currentStep === 4 && 'Pencatatan riwayat kondisi saat bayi baru lahir'}
                        {currentStep === 5 && 'Hasil pengukuran pertumbuhan, status Z-Score, dan imunisasi'}
                        {currentStep === 6 && 'Sanitasi lingkungan tempat tinggal dan rencana tindak lanjut risiko'}
                        {isSummary && 'Periksa kembali kelengkapan data sebelum disimpan permanen'}
                    </p>
                </div>

                {/* PROGRESS BAR (IDENTIK CATIN & BULIN)[cite: 66] */}
                <div className="bg-white p-6 rounded-2xl border-2 border-[#8cc7c4] shadow-sm">
                    <div className="flex justify-between items-center">
                        {steps.map((s) => {
                            const isCurrent = currentStep === s.no && !isSummary;
                            const isPassed = currentStep > s.no || isSummary;

                            return (
                                <div key={s.no} className="flex flex-col items-center flex-1 text-center">
                                    <div
                                        className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-xs transition-all duration-300 shadow ${
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
                                        className={`text-[11px] mt-2 font-bold hidden md:block ${
                                            isCurrent ? 'text-brand-complement' : isPassed ? 'text-[#2c687b]/80' : 'text-gray-400'
                                        }`}
                                    >
                                        {s.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full bg-[#8cc7c4]/25 h-2.5 rounded-full overflow-hidden mt-5 border border-[#8cc7c4]">
                        <div
                            className="bg-brand-complement h-full transition-all duration-300"
                            style={{ width: `${isSummary ? 100 : ((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* BANNER AUTOFILL[cite: 60] */}
                {autofillBanner && (
                    <div className="p-4 bg-sky-50 border border-sky-300 rounded-xl flex items-center justify-between text-sky-900 shadow-sm">
                        <div>
                            <p className="font-bold text-sm">
                                Data ditemukan: {autofillBanner.master.nama_anak} (Kunjungan ke-{autofillBanner.kunjungan_ke})[cite: 60]
                            </p>
                            <p className="text-xs text-sky-700">
                                Isi otomatis data profil anak dan orang tua yang tidak berubah antar kunjungan?[cite: 60]
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

                {/* FORMULIR UTAMA */}
                <form onSubmit={submit} className="bg-white rounded-2xl border-2 border-[#8cc7c4] shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
                    {!isSummary ? (
                        <>
                            {/* ================= TAHAP 1: WILAYAH =================[cite: 60] */}
                            {currentStep === 1 && (
                                <div className="space-y-5">
                                    <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-brand-complement">
                                                Langkah 1: Wilayah Binaan & Data Penugasan
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Penugasan wilayah kerja kader dan identitas tim pendamping.</p>
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
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Bulan & Tahun Laporan *</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={data.bulan_laporan}
                                                    onChange={e => setData('bulan_laporan', e.target.value)}
                                                    className="w-2/3 rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(b => (
                                                        <option key={b} value={b}>{b}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={data.tahun_laporan}
                                                    onChange={e => setData('tahun_laporan', e.target.value)}
                                                    className="w-1/3 rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="2026">2026</option>
                                                    <option value="2025">2025</option>
                                                    <option value="2024">2024</option>
                                                </select>
                                            </div>
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

                                        <div className="border-2 border-dashed border-[#8cc7c4] bg-[#EEF3FF] rounded-xl flex items-center justify-center p-4 text-center">
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
                                                <div className="text-gray-400 text-xs font-medium">--------------------</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ================= TAHAP 2: DATA ORANG TUA =================[cite: 60] */}
                            {currentStep === 2 && (
                                <div className="space-y-5">
                                    <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-brand-complement">
                                                Langkah 2: Data Orang Tua (Ibu)
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Identitas ibu kandung dan kesertaan kontrasepsi modern.</p>
                                        </div>
                                        <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                            Data Ibu
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">NIK Ibu (16 Digit) *</label>
                                            <input
                                                type="text"
                                                value={data.nik_ibu}
                                                onChange={e => setData('nik_ibu', e.target.value.replace(/\D/g, '').slice(0, 16))}
                                                placeholder="3471xxxxxxxxxxxx"
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Ibu *</label>
                                            <input
                                                type="text"
                                                value={data.nama_ibu}
                                                onChange={e => setData('nama_ibu', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir Ibu *</label>
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                value={data.tanggal_lahir_ibu}
                                                onChange={e => setData('tanggal_lahir_ibu', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp Ibu</label>
                                            <input
                                                type="text"
                                                value={data.nomor_whatsapp_ibu}
                                                onChange={e => setData('nomor_whatsapp_ibu', e.target.value.replace(/\D/g, ''))}
                                                placeholder="08xxxxxxxxxx"
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili *</label>
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
                                                    placeholder="RT"
                                                    value={data.rt}
                                                    onChange={e => setData('rt', e.target.value.replace(/\D/g, ''))}
                                                    className="w-1/2 rounded-xl text-sm border-gray-300 h-12"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="RW"
                                                    value={data.rw}
                                                    onChange={e => setData('rw', e.target.value.replace(/\D/g, ''))}
                                                    className="w-1/2 rounded-xl text-sm border-gray-300 h-12"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Penggunaan Kontrasepsi Saat Ini *</label>
                                            <select
                                                value={data.penggunaan_kontrasepsi}
                                                onChange={e => setData('penggunaan_kontrasepsi', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="Ya">Ya</option>
                                                <option value="Tidak">Tidak</option>
                                                <option value="Orang tua bukan PUS">Orang tua bukan PUS</option>
                                            </select>
                                        </div>

                                        {data.penggunaan_kontrasepsi === 'Ya' ? (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Metode KB *</label>
                                                <select
                                                    value={data.metode_kb}
                                                    onChange={e => setData('metode_kb', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    {['MAL (Metode Amenore Laktasi)', 'Kondom', 'Pil KB', 'Suntik KB', 'Implan/Susuk KB', 'IUD/AKDR', 'MOW', 'MOP', 'Kalender', 'Senggama terputus'].map(k => (
                                                        <option key={k} value={k}>{k}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : data.penggunaan_kontrasepsi === 'Tidak' ? (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Alasan Tidak Ber-KB *</label>
                                                <select
                                                    value={data.alasan_tidak_kb}
                                                    onChange={e => setData('alasan_tidak_kb', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="">-- Pilih Alasan --</option>
                                                    {['Ingin hamil', 'Alasan kesehatan', 'Efek samping', 'Pasangan menolak', 'Suami jauh', 'Tidak ada KB yang sesuai', 'Alasan agama', 'Tempat pelayanan jauh', 'Mahal', 'Alat KB tidak tersedia', 'Infertile menopause', 'Tidak tahu tentang KBPP'].map(a => (
                                                        <option key={a} value={a}>{a}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : null}

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

                            {/* ================= TAHAP 3: DATA ANAK =================[cite: 60] */}
                            {currentStep === 3 && (
                                <div className="space-y-5">
                                    <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-brand-complement">
                                                Langkah 3: Data Anak & Pemberian ASI
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Identitas baduta, tanggal lahir, dan pola asupan ASI sejak lahir.</p>
                                        </div>
                                        <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                            Data Anak
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">NIK Anak (16 Digit) *</label>
                                            <input
                                                type="text"
                                                value={data.nik_anak}
                                                onChange={e => handleNikAnakInput(e.target.value)}
                                                placeholder="3471xxxxxxxxxxxx"
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Anak *</label>
                                            <input
                                                type="text"
                                                value={data.nama_anak}
                                                onChange={e => setData('nama_anak', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir Anak *</label>
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                value={data.tanggal_lahir_anak}
                                                onChange={e => setData('tanggal_lahir_anak', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                            {data.tanggal_lahir_anak && (
                                                <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                                                    Usia: {usiaAnak.label} ({kriteriaBaduta})[cite: 60]
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Kelamin *</label>
                                            <div className="flex gap-4 mt-3">
                                                {['Laki-laki', 'Perempuan'].map(jk => (
                                                    <label key={jk} className="inline-flex items-center text-sm font-bold text-gray-700 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="jenis_kelamin_anak"
                                                            value={jk}
                                                            checked={data.jenis_kelamin_anak === jk}
                                                            onChange={e => setData('jenis_kelamin_anak', e.target.value)}
                                                        />
                                                        <span className="ml-2">{jk}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Anak Ke- *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={data.anak_ke}
                                                onChange={e => setData('anak_ke', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        {parseInt(data.anak_ke) > 1 && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir Anak Sebelumnya *</label>
                                                <input
                                                    type="date"
                                                    max={data.tanggal_lahir_anak || new Date().toISOString().split('T')[0]}
                                                    value={data.tanggal_lahir_anak_sebelumnya}
                                                    onChange={e => setData('tanggal_lahir_anak_sebelumnya', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Pemberian ASI (0-6 Bulan) *</label>
                                            <select
                                                value={data.pemberian_asi}
                                                onChange={e => setData('pemberian_asi', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="ASI Eksklusif">ASI Eksklusif</option>
                                                <option value="ASI mix Formula">ASI mix Formula</option>
                                                <option value="Tidak memberikan ASI">Tidak memberikan ASI</option>
                                            </select>
                                        </div>

                                        {usiaAnak.bulan >= 6 && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Riwayat ASI Setelah 6 Bulan *</label>
                                                <select
                                                    value={data.riwayat_asi_setelah_6_bulan}
                                                    onChange={e => setData('riwayat_asi_setelah_6_bulan', e.target.value)}
                                                    className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                >
                                                    <option value="">-- Pilih Pola ASI --</option>
                                                    <option value="ASI Eksklusif">ASI Eksklusif</option>
                                                    <option value="ASI mix Formula">ASI mix Formula</option>
                                                    <option value="Tidak diberikan ASI">Tidak diberikan ASI</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ================= TAHAP 4: KONDISI BBL =================[cite: 60] */}
                            {currentStep === 4 && (
                                <div className="space-y-5">
                                    <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-brand-complement">
                                                Langkah 4: Kondisi Bayi Baru Lahir (BBL)
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Ukuran antropometri lahir dan riwayat komplikasi kelahiran.</p>
                                        </div>
                                        <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                            Antropometri Lahir
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Usia Kehamilan Saat Lahir (Minggu) *</label>
                                            <input
                                                type="number"
                                                min="20"
                                                max="45"
                                                value={data.usia_kehamilan_saat_lahir}
                                                onChange={e => setData('usia_kehamilan_saat_lahir', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                            <span className="text-[10px] text-gray-500 mt-0.5 block">Kurang bulan bila &lt; 37 minggu[cite: 60]</span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Berat Badan Lahir (kg) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.berat_badan_lahir}
                                                onChange={e => setData('berat_badan_lahir', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                            <span className="text-[10px] text-gray-500 mt-0.5 block">BBLR bila &lt; 2.5 kg[cite: 60]</span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Panjang Badan Lahir (cm) *</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={data.panjang_badan_lahir}
                                                onChange={e => setData('panjang_badan_lahir', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                            <span className="text-[10px] text-gray-500 mt-0.5 block">Panjang normal &gt;= 48 cm[cite: 60]</span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Lingkar Kepala Lahir (cm) *</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={data.lingkar_kepala_lahir}
                                                onChange={e => setData('lingkar_kepala_lahir', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Mengalami Asfiksia Saat Lahir? *</label>
                                            <select
                                                value={data.mengalami_asfiksia}
                                                onChange={e => setData('mengalami_asfiksia', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="Tidak">Tidak</option>
                                                <option value="Ya">Ya</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ================= TAHAP 5: KONDISI BADUTA SAAT INI =================[cite: 60] */}
                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-brand-complement">
                                                Langkah 5: Pengukuran Pertumbuhan, Z-Score & Imunisasi
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Penimbangan, pengukuran panjang badan, dan riwayat kesehatan balita.</p>
                                        </div>
                                        <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                            Klinis
                                        </span>
                                    </div>

                                    {/* Hasil Pengukuran & Z-score */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Pengukuran *</label>
                                            <input
                                                type="date"
                                                value={data.tanggal_pengukuran}
                                                onChange={e => setData('tanggal_pengukuran', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Berat Badan Saat Ini (kg) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.berat_badan_saat_ini}
                                                onChange={e => setData('berat_badan_saat_ini', e.target.value)}
                                                placeholder="cth: 8.5"
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Panjang/Tinggi Badan (cm) *</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={data.panjang_badan_saat_ini}
                                                onChange={e => setData('panjang_badan_saat_ini', e.target.value)}
                                                placeholder="cth: 72.0"
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Lingkar Kepala Saat Ini (cm) *</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={data.lingkar_kepala_saat_ini}
                                                onChange={e => setData('lingkar_kepala_saat_ini', e.target.value)}
                                                placeholder="cth: 44.5"
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">BB Bulan Lalu (kg)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.berat_badan_bulan_lalu}
                                                onChange={e => setData('berat_badan_bulan_lalu', e.target.value)}
                                                placeholder="Data pembanding"
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            />
                                        </div>

                                        {/* Box Hasil Z-Score Otomatis */}
                                        <div className="p-3 bg-[#EEF3FF] rounded-xl border border-[#8cc7c4] flex flex-col justify-center">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Status Z-Score WHO</span>
                                            <p className="text-xs font-extrabold text-[#2c687b] mt-0.5">
                                                TB/U: {data.zscore_tb_u || '0.0'} SD | BB/U: {data.zscore_bb_u || '0.0'} SD
                                            </p>
                                        </div>
                                    </div>

                                    {/* Kesehatan & PMT */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Imunisasi Dasar Lengkap *</label>
                                            <select
                                                value={data.imunisasi_dasar_lengkap}
                                                onChange={e => setData('imunisasi_dasar_lengkap', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="Lengkap (selesai), sesuai jadwal">Lengkap (selesai), sesuai jadwal</option>
                                                <option value="Lengkap (selesai), tidak sesuai jadwal">Lengkap (selesai), tidak sesuai jadwal</option>
                                                <option value="Belum lengkap">Belum lengkap</option>
                                                <option value="Tidak lengkap">Tidak lengkap</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Mendapatkan PMT (&gt; 6 Bulan) *[cite: 60]</label>
                                            <select
                                                value={data.mendapatkan_pmt}
                                                onChange={e => setData('mendapatkan_pmt', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="Tidak">Tidak</option>
                                                <option value="Ya">Ya</option>
                                                <option value="Tidak memenuhi kriteria">Tidak memenuhi kriteria</option>
                                            </select>
                                        </div>

                                        {data.mendapatkan_pmt === 'Ya' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Sumber PMT</label>
                                                    <select
                                                        value={data.sumber_pmt}
                                                        onChange={e => setData('sumber_pmt', e.target.value)}
                                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                    >
                                                        <option value="">-- Pilih Sumber PMT --</option>
                                                        <option value="PMT Kelurahan/DAIS">PMT Kelurahan/DAIS</option>
                                                        <option value="PMT Puskesmas/BOK">PMT Puskesmas/BOK</option>
                                                        <option value="DP3AP2KB">DP3AP2KB</option>
                                                        <option value="Genting">Genting</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Lama Waktu Menerima PMT (Hari)[cite: 60]</label>
                                                    <input
                                                        type="number"
                                                        value={data.lama_menerima_pmt_hari}
                                                        onChange={e => setData('lama_menerima_pmt_hari', e.target.value)}
                                                        placeholder="cth: 90"
                                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Paparan Asap Rokok *</label>
                                            <select
                                                value={data.paparan_asap_rokok}
                                                onChange={e => setData(prev => ({ ...prev, paparan_asap_rokok: e.target.value, sumber_paparan_asap_rokok: [] }))}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="Tidak">Tidak</option>
                                                <option value="Pasif">Pasif (Terpapar asap rokok orang lain)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Kehadiran Posyandu / BKB Bulan Ini *</label>
                                            <select
                                                value={data.kehadiran_posyandu_bkb}
                                                onChange={e => setData('kehadiran_posyandu_bkb', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="Ya">Ya</option>
                                                <option value="Tidak">Tidak</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ================= TAHAP 6: LINGKUNGAN & TINDAK LANJUT =================[cite: 60] */}
                            {currentStep === 6 && (
                                <div className="space-y-6">
                                    <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-black text-brand-complement">
                                                Langkah 6: Lingkungan Tempat Tinggal & Rencana Tindak Lanjut
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">Kelayakan sanitasi dan rencana pendampingan khusus kasus berisiko.</p>
                                        </div>
                                        <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                            Tindak Lanjut
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
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Menerima Bantuan Sanitasi / Lingkungan *[cite: 60]</label>
                                            <select
                                                value={data.menerima_bantuan_sanitasi}
                                                onChange={e => setData('menerima_bantuan_sanitasi', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="Tidak">Tidak</option>
                                                <option value="Ya">Ya</option>
                                                <option value="Tidak memenuhi kriteria">Tidak memenuhi kriteria</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Fasilitas Bantuan Sosial *</label>
                                            <select
                                                value={data.fasilitasi_bantuan_sosial}
                                                onChange={e => setData('fasilitasi_bantuan_sosial', e.target.value)}
                                                className="w-full rounded-xl text-sm border-gray-300 h-12"
                                            >
                                                <option value="PKH (Program Keluarga Harapan)">PKH (Program Keluarga Harapan)</option>
                                                <option value="BPNT (Bantuan Pangan Non Tunai)/Sembako">BPNT (Bantuan Pangan Non Tunai)/Sembako</option>
                                                <option value="Tidak, karena tidak memenuhi syarat">Tidak, karena tidak memenuhi syarat</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Unggah Foto Depan Rumah (Maks 5MB)</label>
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

                                    {/* KARTU PENDAMPINGAN FAKTOR RISIKO BADUTA */}
                                    <div className="pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-black text-gray-900 mb-3">
                                            Rencana Pendampingan Lanjutan ({detectedRisiko.length} Faktor Risiko Terdeteksi)
                                        </h4>

                                        {detectedRisiko.length === 0 ? (
                                            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-300 font-semibold text-xs">
                                                ✓ Tidak ada faktor risiko terdeteksi pada baduta ini.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {detectedRisiko.map(riskName => {
                                                    const acuan = TABEL_ACUAN_BADUTA[riskName] || {};
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
                        /* ================= LAYAR RINGKASAN BADUTA =================[cite: 60] */
                        <div className="space-y-5">
                            <div className="border-b pb-3 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Tinjau Ringkasan Data Baduta</h3>
                                    <p className="text-xs text-gray-500">Periksa kembali data sebelum disimpan secara permanen.</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${detectedRisiko.length > 0 ? 'bg-red-100 text-brand-primary' : 'bg-emerald-100 text-emerald-800'}`}>
                                    Status: {detectedRisiko.length > 0 ? 'Berisiko' : 'Tidak Berisiko'}
                                </span>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                                <p><strong>NIK / Nama Anak:</strong> {data.nik_anak} - {data.nama_anak} ({data.jenis_kelamin_anak})</p>
                                <p><strong>Usia Baduta:</strong> {usiaAnak.label} ({kriteriaBaduta})</p>
                                <p><strong>Data Ibu:</strong> {data.nama_ibu} (NIK: {data.nik_ibu})</p>
                                <p><strong>Pengukuran:</strong> BB: {data.berat_badan_saat_ini} kg | TB: {data.panjang_badan_saat_ini} cm | LK: {data.lingkar_kepala_saat_ini} cm</p>
                                <p><strong>Z-Score:</strong> TB/U: {data.zscore_tb_u || '0.0'} SD | BB/U: {data.zscore_bb_u || '0.0'} SD</p>
                                <p><strong>Faktor Risiko Terdeteksi:</strong> {detectedRisiko.join(', ') || 'Nihil'}</p>
                            </div>
                        </div>
                    )}

                    {/* BARIS TOMBOL AKSI */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center -mx-6 md:-mx-8 -mb-6 md:-mb-8 mt-6">
                        <div className="flex gap-2">
                            <Link
                                href="/baduta"
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
                                {currentStep === 6 ? 'Tinjau Ringkasan →' : 'Selanjutnya →'}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-7 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black hover:bg-red-700 transition shadow-lg disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'SIMPAN DATA BADUTA'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}