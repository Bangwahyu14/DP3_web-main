import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Create({ auth, kemantrens = [], kelurahans = [], tpkMembers = [], defaultKemantrenId, defaultKelurahanId }) {
    const [currentStep, setCurrentStep] = useState(1);

    const { data, setData, transform, post, processing, errors } = useForm({
        // LANGKAH 1: Identitas & Wilayah
        kemantren_id: defaultKemantrenId || '',
        kelurahan_id: defaultKelurahanId || '',
        nik: '',
        nama: '',
        alamat: '',
        rt: '',
        rw: '',
        tempat_lahir: '',
        tgl_lahir_perempuan: '',
        tgl_lahir_laki: '',
        no_wa: '',
        tempat_tinggal_domisili: 'Milik Sendiri',
        tpk_member_id: '',
        nama_tpk: '',
        unsur_tpk: '',

        // LANGKAH 2: Pemeriksaan Fisik & Lab CPW
        tanggal_kunjungan: new Date().toISOString().split('T')[0],
        tanggal_pemeriksaan: new Date().toISOString().split('T')[0],
        faskes_jenis: 'Puskesmas',
        faskes_nama: '',
        berat_badan: '',
        tinggi_badan: '',
        kadar_hb: '',
        lila: '',
        paparan_rokok: 'Tidak',
        sumber_rokok: [],
        elsimil_cpw: 'Ideal',

        // LANGKAH 3: Sanitasi & Lingkungan
        sumber_air: [],
        fasilitas_jamban: [],

        // LANGKAH 4: Catin Laki-Laki & Pernikahan
        cpp_merokok: 'Tidak',
        elsimil_cpp: 'Ideal',
        tgl_rencana_nikah: '',
        tempat_rencana_nikah: '',
        no_wa_cpp: '',

        // LANGKAH 5: Intervensi, KIE & Dokumentasi
        dapat_ttd: 'Ya',
        minum_ttd: 'Ya',
        alasan_tidak_ttd: '',
        suplemen_makanan: 'Ya',
        dapat_pmt: 'Tidak',
        sumber_pmt: '',
        bansos: 'Tidak, karena tidak memenuhi syarat',
        memberikan_penyuluhan: 'Ya, perorangan',
        materi_kie: '',
        fasilitas_rujukan: 'Tidak',
        catatan_kader: '',
        input_elsimil: 'Sudah',
        foto_elsimil: null,
        foto_rumah: null,
        foto_jamban: null,
        sasaran_mudah_ditemui: 'Ya',
        sasaran_kooperatif: 'Ya',
    });

    const filteredKelurahans = kelurahans.filter(
        (k) => !data.kemantren_id || String(k.kemantren_id) === String(data.kemantren_id)
    );

    const handleNikChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
        setData('nik', val);
    };

    const handleCheckboxArray = (field, value) => {
        const current = data[field];
        if (current.includes(value)) {
            setData(field, current.filter((item) => item !== value));
        } else {
            setData(field, [...current, value]);
        }
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!data.kemantren_id || !data.kelurahan_id) {
                alert('Pilih Kemantren dan Kelurahan terlebih dahulu.');
                return;
            }
            if (data.nik.length !== 16) {
                alert('NIK harus terdiri dari tepat 16 digit angka.');
                return;
            }
            if (!data.nama.trim()) {
                alert('Nama lengkap Catin wajib diisi.');
                return;
            }
        }

        if (currentStep === 2) {
            if (!data.tanggal_kunjungan ||
                data.berat_badan === '' ||
                data.tinggi_badan === '' ||
                data.lila === '') {
                alert('Isi Tanggal Kunjungan, Berat Badan, Tinggi Badan, dan LiLA.');
                return;
            }
            if (![data.berat_badan, data.tinggi_badan, data.lila].every(
                (value) => Number.isFinite(Number(value)) && Number(value) > 0
            )) {
                alert('Berat Badan, Tinggi Badan, dan LiLA harus berupa angka lebih dari 0.');
                return;
            }
        }
        setCurrentStep((prev) => Math.min(prev + 1, 5));
    };

    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const submit = (e) => {
        e.preventDefault();

        // Sesuaikan nama field formulir dengan field yang dibaca CatinController@store.
        // Form asli dan tampilan 5 langkah tidak perlu diubah.
        transform((values) => ({
            ...values,
            tanggal_lahir: values.tgl_lahir_perempuan || null,
            tanggal_lahir_pria: values.tgl_lahir_laki || null,
            nama_faskes: values.faskes_nama,
            no_wa_pria: values.no_wa_cpp,
            hasil_elsimil_wanita: values.elsimil_cpw,
            hasil_elsimil_pria: values.elsimil_cpp,
            terpapar_rokok: values.paparan_rokok === 'Ya' ? 1 : 0,
            pria_merokok: values.cpp_merokok === 'Ya' ? 1 : 0,
            sumber_paparan_rokok: values.sumber_rokok.join(', '),
            sumber_air_minum: values.sumber_air.join(', '),
            fasilitas_jamban: values.fasilitas_jamban.join(', '),
            alasan_tidak_minum_ttd: values.alasan_tidak_ttd,
            dapat_ttd: values.dapat_ttd === 'Ya' ? 1 : 0,
            minum_ttd: values.minum_ttd === 'Ya' ? 1 : 0,
            suplemen_makanan: values.suplemen_makanan === 'Ya' ? 1 : 0,
            penyuluhan: values.memberikan_penyuluhan,
            kie_diberikan: values.materi_kie,
            rujukan_faskes: values.fasilitas_rujukan,
            catatan: values.catatan_kader,
            status_elsimil: values.input_elsimil,
            mudah_ditemui: values.sasaran_mudah_ditemui === 'Ya' ? 1 : 0,
            kooperatif: values.sasaran_kooperatif === 'Ya' ? 1 : 0,
        }));

        post('/catin', {
            forceFormData: true,
            preserveScroll: true,
            onError: (validationErrors) => {
                if (
                    validationErrors.berat_badan ||
                    validationErrors.tinggi_badan ||
                    validationErrors.lila ||
                    validationErrors.kadar_hb ||
                    validationErrors.tanggal_kunjungan
                ) {
                    setCurrentStep(2);
                } else if (
                    validationErrors.nik ||
                    validationErrors.nama ||
                    validationErrors.kelurahan_id
                ) {
                    setCurrentStep(1);
                } else if (
                    validationErrors.foto_elsimil ||
                    validationErrors.foto_rumah ||
                    validationErrors.foto_jamban
                ) {
                    setCurrentStep(5);
                }
            },
        });
    };

    const steps = [
        { no: 1, title: 'Identitas & Domisili' },
        { no: 2, title: 'Fisik & Lab CPW' },
        { no: 3, title: 'Air & Sanitasi' },
        { no: 4, title: 'Data CPP & Nikah' },
        { no: 5, title: 'Intervensi & Foto' },
    ];

    const selectedKemantren = kemantrens.find((k) => String(k.id) === String(data.kemantren_id));
    const selectedKelurahan = kelurahans.find((k) => String(k.id) === String(data.kelurahan_id));

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Form Catin" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* BREADCRUMB */}
                <div className="text-xs font-semibold text-gray-500">
                    Form Pendataan &gt;{' '}
                    <span className="text-[#2c687b] font-bold">
                        {steps[currentStep - 1]?.title}
                    </span>
                </div>

                {/* JUDUL DAN SUBJUDUL */}
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        Pendaftaran Calon Pengantin (Catin)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {currentStep === 1 && 'Identitas calon pengantin wanita dan penugasan wilayah kader TPK.'}
                        {currentStep === 2 && 'Pemeriksaan fisik dan pengukuran laboratorium calon pengantin wanita.'}
                        {currentStep === 3 && 'Kelayakan sanitasi dan kualitas sumber air minum tempat tinggal.'}
                        {currentStep === 4 && 'Data calon suami, riwayat merokok, dan rencana akad pernikahan.'}
                        {currentStep === 5 && 'Fasilitasi rujukan, suplementasi TTD/PMT, edukasi kader, dan unggah foto dokumentasi.'}
                    </p>
                </div>

                {/* PROGRESS BAR (IDENTIK BULIN & WIREFRAME) */}
                <div className="bg-white p-6 rounded-2xl border-2 border-[#8cc7c4] shadow-sm">
                    <div className="flex justify-between items-center">
                        {steps.map((s) => {
                            const isCurrent = currentStep === s.no;
                            const isPassed = currentStep > s.no;

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
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* FORM BODY CARD DENGAN BORDER TIPIS TEAL */}
                <form onSubmit={submit} className="bg-white rounded-2xl border-2 border-[#8cc7c4] shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
                    {Object.keys(errors).length > 0 && (
                        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                            <p className="mb-2 font-bold">Data belum tersimpan. Perbaiki kesalahan berikut:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                {Object.entries(errors).map(([field, message]) => (
                                    <li key={field}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* ================= STEP 1: IDENTITAS & DOMISILI ================= */}
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-brand-complement">
                                        Langkah 1: Wilayah Binaan & Identitas Catin Perempuan
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Identitas calon pengantin wanita dan penugasan wilayah kader TPK.</p>
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
                                        onChange={(e) => setData((prev) => ({ ...prev, kemantren_id: e.target.value, kelurahan_id: '' }))}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="">-- Pilih Kemantren --</option>
                                        {kemantrens.map((k) => (
                                            <option key={k.id} value={k.id}>{k.nama}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Kelurahan *</label>
                                    <select
                                        value={data.kelurahan_id}
                                        disabled={!data.kemantren_id}
                                        onChange={(e) => setData('kelurahan_id', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12 disabled:bg-gray-100"
                                    >
                                        <option value="">-- Pilih Kelurahan --</option>
                                        {filteredKelurahans.map((k) => (
                                            <option key={k.id} value={k.id}>{k.nama}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">NIK Perempuan (16 Digit Angka) *</label>
                                    <input
                                        type="text"
                                        value={data.nik}
                                        onChange={handleNikChange}
                                        placeholder="3471xxxxxxxxxxxx"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                    <span className="text-[11px] font-bold text-[#2c687b] mt-1 block">
                                        Status: <span className={data.nik.length === 16 ? 'text-emerald-600' : 'text-brand-primary'}>{data.nik.length} / 16 Digit</span>
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Perempuan *</label>
                                    <input
                                        type="text"
                                        value={data.nama}
                                        onChange={(e) => setData('nama', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Domisili (Jalan/Gang, No Rumah) *</label>
                                    <textarea
                                        rows="2"
                                        value={data.alamat}
                                        onChange={(e) => setData('alamat', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">RT / RW *</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={data.rt}
                                            onChange={(e) => setData('rt', e.target.value)}
                                            className="w-1/2 rounded-xl text-sm border-gray-300 h-12"
                                        >
                                            <option value="">Pilih RT</option>
                                            {Array.from({ length: 30 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>RT {String(i + 1).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={data.rw}
                                            onChange={(e) => setData('rw', e.target.value)}
                                            className="w-1/2 rounded-xl text-sm border-gray-300 h-12"
                                        >
                                            <option value="">Pilih RW</option>
                                            {Array.from({ length: 20 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>RW {String(i + 1).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tempat Lahir</label>
                                    <input
                                        type="text"
                                        value={data.tempat_lahir}
                                        onChange={(e) => setData('tempat_lahir', e.target.value)}
                                        placeholder="cth: Yogyakarta"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir Catin Perempuan *</label>
                                    <input
                                        type="date"
                                        value={data.tgl_lahir_perempuan}
                                        onChange={(e) => setData('tgl_lahir_perempuan', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Lahir Catin Laki-Laki *</label>
                                    <input
                                        type="date"
                                        value={data.tgl_lahir_laki}
                                        onChange={(e) => setData('tgl_lahir_laki', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp CPW</label>
                                    <input
                                        type="text"
                                        value={data.no_wa}
                                        onChange={(e) => setData('no_wa', e.target.value.replace(/\D/g, ''))}
                                        placeholder="08xxxxxxxxxx"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tempat Tinggal Domisili</label>
                                    <select
                                        value={data.tempat_tinggal_domisili}
                                        onChange={(e) => setData('tempat_tinggal_domisili', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Milik Sendiri">Milik Sendiri</option>
                                        <option value="Menumpang Keluarga">Menumpang Keluarga</option>
                                        <option value="Kontrak / Sewa">Kontrak / Sewa</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Anggota Tim TPK yang Bertugas *</label>
                                    <select
                                        value={data.tpk_member_id}
                                        onChange={(e) => {
                                            const m = tpkMembers.find((item) => String(item.id) === String(e.target.value));
                                            setData((prev) => ({
                                                ...prev,
                                                tpk_member_id: e.target.value,
                                                nama_tpk: m ? m.nama_anggota : '',
                                                unsur_tpk: m ? m.unsur : '',
                                            }));
                                        }}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="">-- Pilih Anggota Tim Lapangan --</option>
                                        {tpkMembers.map((m) => (
                                            <option key={m.id} value={m.id}>{m.nama_anggota} ({m.unsur})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* KOTAK RINGKASAN PETA GARIS PUTUS-PUTUS SESUAI BULIN & WIREFRAME */}
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

                    {/* ================= STEP 2: FISIK & LAB CPW ================= */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-brand-complement">
                                        Langkah 2: Antropometri & Skrining Kesehatan CPW
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Pencatatan hasil pemeriksaan fisik, hemoglobin, dan deteksi risiko KEK/anemia.</p>
                                </div>
                                <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                    Pemeriksaan Fisik
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Kunjungan</label>
                                    <input
                                        type="date"
                                        value={data.tanggal_kunjungan}
                                        onChange={(e) => setData('tanggal_kunjungan', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Pemeriksaan Lab</label>
                                    <input
                                        type="date"
                                        value={data.tanggal_pemeriksaan}
                                        onChange={(e) => setData('tanggal_pemeriksaan', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Fasilitas Kesehatan</label>
                                    <select
                                        value={data.faskes_jenis}
                                        onChange={(e) => setData('faskes_jenis', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Rumah Sakit">Rumah Sakit</option>
                                        <option value="Puskesmas">Puskesmas</option>
                                        <option value="Klinik">Klinik</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Faskes</label>
                                    <input
                                        type="text"
                                        value={data.faskes_nama}
                                        onChange={(e) => setData('faskes_nama', e.target.value)}
                                        placeholder="cth: Puskesmas Mergangsan"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Berat Badan (kg)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.berat_badan}
                                        onChange={(e) => setData('berat_badan', e.target.value)}
                                        placeholder="48.5"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                    {errors.berat_badan && (
                                        <p className="mt-1 text-xs text-red-600">{errors.berat_badan}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tinggi Badan (cm)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.tinggi_badan}
                                        onChange={(e) => setData('tinggi_badan', e.target.value)}
                                        placeholder="155.0"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                    {errors.tinggi_badan && (
                                        <p className="mt-1 text-xs text-red-600">{errors.tinggi_badan}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Kadar Hemoglobin / Hb (g/dl)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={data.kadar_hb}
                                        onChange={(e) => setData('kadar_hb', e.target.value)}
                                        placeholder="Ambang Anemia: 12.0"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">LiLA (Lingkar Lengan Atas) (cm)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={data.lila}
                                        onChange={(e) => setData('lila', e.target.value)}
                                        placeholder="Ambang KEK: 23.5"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                    {errors.lila && (
                                        <p className="mt-1 text-xs text-red-600">{errors.lila}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Paparan Asap Rokok</label>
                                    <div className="mt-2 flex gap-6">
                                        {['Ya', 'Tidak'].map((opt) => (
                                            <label key={opt} className="inline-flex items-center text-sm font-bold text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="paparan_rokok"
                                                    value={opt}
                                                    checked={data.paparan_rokok === opt}
                                                    onChange={(e) => setData('paparan_rokok', e.target.value)}
                                                />
                                                <span className="ml-2">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Hasil Skrining ELSIMIL CPW</label>
                                    <select
                                        value={data.elsimil_cpw}
                                        onChange={(e) => setData('elsimil_cpw', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ideal">Ideal</option>
                                        <option value="Berisiko">Berisiko</option>
                                    </select>
                                </div>

                                {data.paparan_rokok === 'Ya' && (
                                    <div className="md:col-span-2 p-4 bg-brand-secondary rounded-xl border-2 border-brand-primary">
                                        <label className="block text-sm font-extrabold text-brand-primary mb-2">
                                            Sumber Paparan Asap Rokok:
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-800">
                                            {[
                                                'Diri sendiri',
                                                'Calon suami',
                                                'Lingkungan keluarga / dalam rumah',
                                                'Lingkungan kerja',
                                                'Lainnya',
                                            ].map((src) => (
                                                <label key={src} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#8cc7c4]">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.sumber_rokok.includes(src)}
                                                        onChange={() => handleCheckboxArray('sumber_rokok', src)}
                                                    />
                                                    <span className="font-semibold text-gray-700">{src}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 3: SANITASI & AIR ================= */}
                    {currentStep === 3 && (
                        <div className="space-y-5">
                            <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-brand-complement">
                                        Langkah 3: Sanitasi Lingkungan & Air Bersih
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Kelayakan sanitasi dan kualitas sumber air minum tempat tinggal.</p>
                                </div>
                                <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                    Sanitasi
                                </span>
                            </div>

                            <div className="p-5 bg-brand-secondary rounded-2xl border-2 border-[#8cc7c4]">
                                <label className="block text-sm font-black text-brand-complement mb-3">
                                    Sumber Air Minum Utama (Dapat memilih lebih dari satu):
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {[
                                        'Air Kemasan/isi ulang',
                                        'Ledeng/PAM',
                                        'Sumur bor/pompa',
                                        'Sumur terlindung',
                                        'Sumur tidak terlindung',
                                        'Mata air terlindung',
                                        'Mata air tidak terlindung',
                                        'Air permukaan (sungai/danau/waduk/kolam/irigasi)',
                                        'Air Hujan',
                                    ].map((opt) => (
                                        <label key={opt} className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-[#8cc7c4] hover:border-brand-complement cursor-pointer transition">
                                            <input
                                                type="checkbox"
                                                checked={data.sumber_air.includes(opt)}
                                                onChange={() => handleCheckboxArray('sumber_air', opt)}
                                            />
                                            <span className="font-semibold text-gray-800">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 bg-brand-secondary rounded-2xl border-2 border-[#8cc7c4] mt-4">
                                <label className="block text-sm font-black text-brand-complement mb-3">
                                    Fasilitas Tempat Buang Air Besar / Jamban (Dapat memilih lebih dari satu):
                                </label>
                                <div className="space-y-2 text-sm">
                                    {[
                                        'Jamban milik sendiri dengan leher angsa & tangkiseptik/IPAL',
                                        'Jamban MCK Komunal dengan leher angsa & tangki septik/IPAL',
                                        'Jamban milik sendiri tidak leher angsa dengan tangkiseptik/IPAL',
                                        'Jamban MCK Komunal tidak leher angsa dengan tangki septik/IPAL',
                                        'Jamban milik sendiri dengan leher angsa tanpa tangki septik/IPAL',
                                        'Jamban MCK Komunal dengan leher angsa tanpa tangki septik/IPAL',
                                        'Jamban milik sendiri tanpa leher angsa & tanpa tangkiseptik/IPAL',
                                        'Jamban MCK Komunal tanpa leher angsa & tanpa tangki septik/IPAL',
                                    ].map((opt) => (
                                        <label key={opt} className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-[#8cc7c4] hover:border-brand-complement cursor-pointer transition">
                                            <input
                                                type="checkbox"
                                                checked={data.fasilitas_jamban.includes(opt)}
                                                onChange={() => handleCheckboxArray('fasilitas_jamban', opt)}
                                            />
                                            <span className="font-semibold text-gray-800">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 4: DATA CPP & PERNIKAHAN ================= */}
                    {currentStep === 4 && (
                        <div className="space-y-5">
                            <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-brand-complement">
                                        Langkah 4: Calon Pengantin Laki-Laki & Rencana Pernikahan
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Data calon suami, riwayat merokok, dan jadwal akad pernikahan.</p>
                                </div>
                                <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                    Data CPP
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Merokok Aktif (CPP)</label>
                                    <select
                                        value={data.cpp_merokok}
                                        onChange={(e) => setData('cpp_merokok', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Tidak">Tidak</option>
                                        <option value="Ya">Ya</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Hasil Skrining ELSIMIL CPP</label>
                                    <select
                                        value={data.elsimil_cpp}
                                        onChange={(e) => setData('elsimil_cpp', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ideal">Ideal</option>
                                        <option value="Berisiko">Berisiko</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Rencana Pernikahan</label>
                                    <input
                                        type="date"
                                        value={data.tgl_rencana_nikah}
                                        onChange={(e) => setData('tgl_rencana_nikah', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Tempat Rencana Pernikahan</label>
                                    <input
                                        type="text"
                                        value={data.tempat_rencana_nikah}
                                        onChange={(e) => setData('tempat_rencana_nikah', e.target.value)}
                                        placeholder="cth: KUA Umbulharjo"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp CPP</label>
                                    <input
                                        type="text"
                                        value={data.no_wa_cpp}
                                        onChange={(e) => setData('no_wa_cpp', e.target.value.replace(/\D/g, ''))}
                                        placeholder="08xxxxxxxxxx"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 5: INTERVENSI & FOTO ================= */}
                    {currentStep === 5 && (
                        <div className="space-y-5">
                            <div className="border-b-2 border-[#8cc7c4]/40 pb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-brand-complement">
                                        Langkah 5: Intervensi, KIE & Dokumentasi Pendampingan
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Fasilitasi rujukan, suplementasi TTD/PMT, edukasi kader, dan unggah foto.</p>
                                </div>
                                <span className="bg-[#8cc7c4]/20 text-brand-complement text-xs font-bold px-2.5 py-1 rounded-md border border-[#8cc7c4]">
                                    Intervensi Akhir
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Mendapatkan Tablet Tambah Darah (TTD)</label>
                                    <select
                                        value={data.dapat_ttd}
                                        onChange={(e) => setData('dapat_ttd', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Apakah Konsumsi TTD Dipastikan Diminum?</label>
                                    <select
                                        value={data.minum_ttd}
                                        onChange={(e) => setData('minum_ttd', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>

                                {data.minum_ttd === 'Tidak' && (
                                    <div className="md:col-span-2 p-4 bg-brand-secondary rounded-xl border-2 border-brand-primary">
                                        <label className="block text-sm font-black text-brand-primary mb-1">
                                            Alasan Tidak Minum TTD:
                                        </label>
                                        <select
                                            value={data.alasan_tidak_ttd}
                                            onChange={(e) => setData('alasan_tidak_ttd', e.target.value)}
                                            className="w-full rounded-lg text-sm font-semibold"
                                        >
                                            <option value="">-- Pilih Alasan --</option>
                                            <option value="Mual">Mual</option>
                                            <option value="Lupa">Lupa</option>
                                            <option value="Malas">Malas</option>
                                        </select>

                                        {data.alasan_tidak_ttd === 'Mual' && (
                                            <div className="mt-3 text-sm text-brand-complement bg-white p-3.5 rounded-xl border-2 border-[#8cc7c4] font-medium">
                                                💡 <strong>Arahan Kader:</strong> Disarankan untuk meminumnya pada malam hari (sebelum tidur) dan tidak dalam kondisi perut kosong.
                                            </div>
                                        )}
                                        {data.alasan_tidak_ttd === 'Lupa' && (
                                            <div className="mt-3 text-sm text-brand-complement bg-white p-3.5 rounded-xl border-2 border-[#8cc7c4] font-medium">
                                                💡 <strong>Arahan Kader:</strong> Dibuatkan jadwal rutin melalui Alarm handphone sasaran.
                                            </div>
                                        )}
                                        {data.alasan_tidak_ttd === 'Malas' && (
                                            <div className="mt-3 text-sm text-brand-complement bg-white p-3.5 rounded-xl border-2 border-[#8cc7c4] font-medium">
                                                💡 <strong>Arahan Kader:</strong> Perlu KIE pentingnya konsumsi MMS (manfaat dan kegunaannya).
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Memastikan Konsumsi Suplemen Makanan</label>
                                    <select
                                        value={data.suplemen_makanan}
                                        onChange={(e) => setData('suplemen_makanan', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Mendapatkan PMT</label>
                                    <select
                                        value={data.dapat_pmt}
                                        onChange={(e) => setData('dapat_pmt', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Tidak">Tidak</option>
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak memenuhi kriteria">Tidak memenuhi kriteria</option>
                                    </select>
                                </div>

                                {data.dapat_pmt === 'Ya' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Sumber PMT</label>
                                        <select
                                            value={data.sumber_pmt}
                                            onChange={(e) => setData('sumber_pmt', e.target.value)}
                                            className="w-full rounded-xl text-sm border-gray-300 h-12"
                                        >
                                            <option value="">Pilih Sumber PMT</option>
                                            <option value="PMT Kelurahan/DAIS">PMT Kelurahan/DAIS</option>
                                            <option value="PMT Puskesmas/BOK">PMT Puskesmas/BOK</option>
                                            <option value="DP3AP2KB">DP3AP2KB</option>
                                            <option value="Genting">Genting (Gerakan Orang Tua Asuh Cegah Stunting)</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Fasilitas Bantuan Sosial</label>
                                    <select
                                        value={data.bansos}
                                        onChange={(e) => setData('bansos', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="PKH">PKH (Program Keluarga Harapan)</option>
                                        <option value="BPNT">BPNT (Bantuan Pangan Non Tunai) / Sembako</option>
                                        <option value="Tidak, karena tidak memenuhi syarat">Tidak, karena tidak memenuhi syarat</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Memberikan Penyuluhan</label>
                                    <select
                                        value={data.memberikan_penyuluhan}
                                        onChange={(e) => setData('memberikan_penyuluhan', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ya, perorangan">Ya, perorangan</option>
                                        <option value="Ya, kelompok">Ya, kelompok</option>
                                        <option value="Ya, perorangan dan kelompok">Ya, perorangan dan kelompok</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Materi Penyuluhan / KIE</label>
                                    <input
                                        type="text"
                                        value={data.materi_kie}
                                        onChange={(e) => setData('materi_kie', e.target.value)}
                                        placeholder="cth: Gizi seimbang catin, pencegahan KEK"
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Fasilitas Rujukan Faskes</label>
                                    <select
                                        value={data.fasilitas_rujukan}
                                        onChange={(e) => setData('fasilitas_rujukan', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ya, sedang proses">Ya, sedang proses</option>
                                        <option value="Ya, sudah mendapat tatalaksana">Ya, sudah mendapat tatalaksana</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Input ke Elsimil BKKBN</label>
                                    <select
                                        value={data.input_elsimil}
                                        onChange={(e) => setData('input_elsimil', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Sudah">Sudah</option>
                                        <option value="Belum">Belum</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Khusus Kader</label>
                                    <textarea
                                        rows="2"
                                        value={data.catatan_kader}
                                        onChange={(e) => setData('catatan_kader', e.target.value)}
                                        placeholder="cth: Sasaran mengalami riwayat medis tertentu"
                                        className="w-full rounded-xl text-sm border-gray-300"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Apakah Sasaran Mudah Ditemui?</label>
                                    <select
                                        value={data.sasaran_mudah_ditemui}
                                        onChange={(e) => setData('sasaran_mudah_ditemui', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Apakah Sasaran Kooperatif Saat Didampingi?</label>
                                    <select
                                        value={data.sasaran_kooperatif}
                                        onChange={(e) => setData('sasaran_kooperatif', e.target.value)}
                                        className="w-full rounded-xl text-sm border-gray-300 h-12"
                                    >
                                        <option value="Ya">Ya</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Unggah Screenshot Laporan Elsimil (Maks 2MB)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('foto_elsimil', e.target.files[0])}
                                        className="w-full text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Unggah Foto Depan Rumah Sasaran (Maks 2MB)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('foto_rumah', e.target.files[0])}
                                        className="w-full text-xs"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Unggah Foto Fasilitas Jamban (Maks 2MB)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('foto_jamban', e.target.files[0])}
                                        className="w-full text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NAVIGASI TOMBOL */}
                    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                            >
                                ← Sebelumnya
                            </button>
                        ) : (
                            <Link
                                href="/catin"
                                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                            >
                                ✕ Batal
                            </Link>
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-2.5 bg-[#3F4452] text-white rounded-xl text-xs font-extrabold hover:bg-black transition shadow"
                            >
                                Selanjutnya →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-7 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black hover:bg-red-700 transition shadow-lg disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'SIMPAN DATA CATIN'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}