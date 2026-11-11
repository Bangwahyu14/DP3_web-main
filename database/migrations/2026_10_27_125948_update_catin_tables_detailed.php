<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catin_masters', function (Blueprint $table) {
            $table->string('tempat_lahir')->nullable()->after('nama');
            $table->date('tanggal_lahir_pria')->nullable()->after('tanggal_lahir');
            $table->string('no_wa_pria', 20)->nullable()->after('no_wa');
            $table->string('rt', 5)->nullable()->after('alamat');
            $table->string('rw', 5)->nullable()->after('rt');
            $table->string('tempat_tinggal_domisili')->nullable();
            $table->string('kelurahan_domisili')->nullable();
            $table->string('kecamatan_domisili')->nullable();
            $table->string('kota_domisili')->nullable();
            $table->string('provinsi_domisili')->nullable();
        });

        Schema::table('catin_kunjungans', function (Blueprint $table) {
            $table->string('nama_tpk')->nullable();
            $table->string('unsur_tpk')->nullable();
            $table->date('tanggal_pemeriksaan')->nullable();
            $table->string('faskes_jenis')->nullable();
            $table->string('nama_faskes')->nullable();
            $table->json('sumber_paparan_rokok')->nullable();
            $table->string('hasil_elsimil_wanita')->nullable();
            $table->json('sumber_air_minum')->nullable();
            $table->json('fasilitas_jamban')->nullable();

            // Sisi Pria & Rencana Nikah
            $table->boolean('pria_merokok')->default(false);
            $table->string('hasil_elsimil_pria')->nullable();
            $table->date('tgl_rencana_nikah')->nullable();
            $table->string('tempat_rencana_nikah')->nullable();

            // Intervensi & TTD
            $table->boolean('dapat_ttd')->default(false);
            $table->boolean('minum_ttd')->default(false);
            $table->string('alasan_tidak_minum_ttd')->nullable();
            $table->boolean('suplemen_makanan')->default(false);
            $table->string('dapat_pmt')->nullable();
            $table->string('sumber_pmt')->nullable();
            $table->string('bansos')->nullable();
            $table->string('penyuluhan')->nullable();
            $table->string('kie_diberikan')->nullable();
            $table->string('rujukan_faskes')->nullable();

            // Evaluasi & Dokumen
            $table->string('status_elsimil')->nullable();
            $table->string('foto_elsimil')->nullable();
            $table->string('foto_rumah')->nullable();
            $table->string('foto_jamban')->nullable();
            $table->boolean('mudah_ditemui')->default(true);
            $table->boolean('kooperatif')->default(true);
            $table->string('hasil_pendampingan')->nullable();
        });
    }

    public function down(): void
    {
        // rollback column drops if needed
    }
};