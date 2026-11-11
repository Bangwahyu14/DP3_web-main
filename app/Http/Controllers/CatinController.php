<?php

namespace App\Http\Controllers;

use App\Models\CatinMaster;
use App\Models\CatinKunjungan;
use App\Models\Kelurahan;
use App\Models\Kemantren;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CatinController extends Controller
{
    public function index()
    {
        $catins = CatinMaster::with(['kelurahan', 'kunjungans' => fn($q) => $q->latest()->limit(1)])
            ->latest()
            ->paginate(10);

        return Inertia::render('Catin/Index', ['catins' => $catins]);
    }

    public function create(Request $request)
    {
        $user = $request->user();

        $kemantrens = Kemantren::orderBy('id');
        $kelurahans = Kelurahan::orderBy('id');

        if ($user->role === 'kader' || $user->role === 'admin_kemantren') {
            if ($user->kemantren_id) {
                $kemantrens->where('id', $user->kemantren_id);
                $kelurahans->where('kemantren_id', $user->kemantren_id);
            }
        }

        if ($user->role === 'kader') {
            $tpkMembers = $user->tpkMembers()->orderBy('nama_anggota')->get(['id', 'nama_anggota', 'unsur']);
        } else {
            $tpkMembers = \App\Models\TpkMember::orderBy('nama_anggota')->get(['id', 'nama_anggota', 'unsur']);
        }

        return Inertia::render('Catin/Create', [
            'kemantrens' => $kemantrens->get(['id', 'nama']),
            'kelurahans' => $kelurahans->get(['id', 'kemantren_id', 'nama']),
            'tpkMembers' => $tpkMembers,
            'defaultKemantrenId' => $user->kemantren_id,
            'defaultKelurahanId' => $user->kelurahan_id,
        ]);
    }

    // Endpoint API untuk cek NIK dan autofill
    public function checkNik($nik)
    {
        $catin = CatinMaster::where('nik', $nik)->first();
        return response()->json([
            'exists' => (bool)$catin,
            'data' => $catin
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nik' => 'required|numeric|digits:16',
            'nama' => 'required|string|max:255',
            'kelurahan_id' => 'required',
            'tanggal_kunjungan' => 'required|date',
            'berat_badan' => 'required|numeric',
            'tinggi_badan' => 'required|numeric',
            'lila' => 'required|numeric',
            'kadar_hb' => 'nullable|numeric',
            'foto_elsimil' => 'nullable|image|max:2048',
            'foto_rumah' => 'nullable|image|max:2048',
            'foto_jamban' => 'nullable|image|max:2048',
        ]);

        DB::transaction(function () use ($request, $validated) {
            // Kalkulasi Risiko
            $tbMeter = $request->tinggi_badan / 100;
            $imt = round($request->berat_badan / ($tbMeter * $tbMeter), 2);
            $isKek = (float)$request->lila < 23.5;
            $isAnemia = $request->filled('kadar_hb') && (float)$request->kadar_hb < 12.0;
            $statusRisiko = ($isKek || $isAnemia) ? 'berisiko' : 'tidak_berisiko';

            // Master Catin (Insert jika baru, Update jika sudah ada)
            $catin = CatinMaster::updateOrCreate(
                ['nik' => $request->nik],
                [
                    'nama' => $request->nama,
                    'tempat_lahir' => $request->tempat_lahir,
                    'tanggal_lahir' => $request->tanggal_lahir,
                    'tanggal_lahir_pria' => $request->tanggal_lahir_pria,
                    'no_wa' => $request->no_wa,
                    'no_wa_pria' => $request->no_wa_pria,
                    'alamat' => $request->alamat,
                    'rt' => $request->rt,
                    'rw' => $request->rw,
                    'tempat_tinggal_domisili' => $request->tempat_tinggal_domisili,
                    'kelurahan_domisili' => $request->kelurahan_domisili,
                    'kecamatan_domisili' => $request->kecamatan_domisili,
                    'kota_domisili' => $request->kota_domisili,
                    'provinsi_domisili' => $request->provinsi_domisili,
                    'kelurahan_id' => $request->kelurahan_id,
                    'created_by' => $request->user()->id,
                    'status_risiko' => $statusRisiko,
                ]
            );

            // Handle Upload Foto
            $fotoElsimil = $request->file('foto_elsimil')?->store('catin/elsimil', 'public');
            $fotoRumah = $request->file('foto_rumah')?->store('catin/rumah', 'public');
            $fotoJamban = $request->file('foto_jamban')?->store('catin/jamban', 'public');

            // Simpan Riwayat Kunjungan
            CatinKunjungan::create([
                'catin_master_id' => $catin->id,
                'user_id' => $request->user()->id,
                'nama_tpk' => $request->nama_tpk,
                'unsur_tpk' => $request->unsur_tpk,
                'tanggal_kunjungan' => $request->tanggal_kunjungan,
                'tanggal_pemeriksaan' => $request->tanggal_pemeriksaan,
                'faskes_jenis' => $request->faskes_jenis,
                'nama_faskes' => $request->nama_faskes,
                'berat_badan' => $request->berat_badan,
                'tinggi_badan' => $request->tinggi_badan,
                'imt' => $imt,
                'lila' => $request->lila,
                'kadar_hb' => $request->kadar_hb,
                'is_kek' => $isKek,
                'is_anemia' => $isAnemia,
                'terpapar_rokok' => (bool)$request->terpapar_rokok,
                'sumber_paparan_rokok' => $request->sumber_paparan_rokok,
                'hasil_elsimil_wanita' => $request->hasil_elsimil_wanita,
                'sumber_air_minum' => $request->sumber_air_minum,
                'fasilitas_jamban' => $request->fasilitas_jamban,
                'pria_merokok' => (bool)$request->pria_merokok,
                'hasil_elsimil_pria' => $request->hasil_elsimil_pria,
                'tgl_rencana_nikah' => $request->tgl_rencana_nikah,
                'tempat_rencana_nikah' => $request->tempat_rencana_nikah,
                'dapat_ttd' => (bool)$request->dapat_ttd,
                'minum_ttd' => (bool)$request->minum_ttd,
                'alasan_tidak_minum_ttd' => $request->alasan_tidak_minum_ttd,
                'suplemen_makanan' => (bool)$request->suplemen_makanan,
                'dapat_pmt' => $request->dapat_pmt,
                'sumber_pmt' => $request->sumber_pmt,
                'bansos' => $request->bansos,
                'penyuluhan' => $request->penyuluhan,
                'kie_diberikan' => $request->kie_diberikan,
                'rujukan_faskes' => $request->rujukan_faskes,
                'catatan' => $request->catatan,
                'status_elsimil' => $request->status_elsimil,
                'foto_elsimil' => $fotoElsimil,
                'foto_rumah' => $fotoRumah,
                'foto_jamban' => $fotoJamban,
                'mudah_ditemui' => (bool)$request->mudah_ditemui,
                'kooperatif' => (bool)$request->kooperatif,
                'hasil_pendampingan' => $request->hasil_pendampingan,
            ]);
        });

        return redirect('/catin');
    }
}