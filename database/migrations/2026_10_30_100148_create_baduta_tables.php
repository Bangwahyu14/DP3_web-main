<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Data Master Baduta (Identitas Permanen per NIK Anak)
        Schema::create('baduta_masters', function (Blueprint $table) {
            $table->id();
            $table->string('nik_anak', 16)->unique();
            $table->string('nama_anak');
            $table->date('tanggal_lahir_anak');
            $table->enum('jenis_kelamin_anak', ['Laki-laki', 'Perempuan']);
            $table->integer('anak_ke')->default(1);
            $table->date('tanggal_lahir_anak_sebelumnya')->nullable();

            $table->string('nik_ibu', 16);
            $table->string('nama_ibu');
            $table->date('tanggal_lahir_ibu');
            $table->string('nomor_whatsapp_ibu', 20)->nullable();
            $table->text('alamat');
            $table->string('rt', 5);
            $table->string('rw', 5);
            $table->boolean('domisili_min_6_bulan')->default(true);

            $table->string('kemantren_id', 20);
            $table->string('kelurahan_id', 20);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('status_risiko')->default('tidak_berisiko');
            $table->timestamps();

            $table->foreign('kemantren_id')->references('id')->on('kemantrens')->cascadeOnDelete();
            $table->foreign('kelurahan_id')->references('id')->on('kelurahans')->cascadeOnDelete();
        });

        // 2. Kunjungan Pendampingan Baduta
        Schema::create('baduta_kunjungans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('baduta_master_id')->constrained('baduta_masters')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tpk_member_id')->nullable()->constrained('tpk_members')->nullOnDelete();

            $table->string('bulan_laporan');
            $table->string('tahun_laporan');
            $table->date('tanggal_kunjungan');
            $table->integer('kunjungan_ke')->default(1);
            $table->string('tim_tpk')->nullable();
            $table->string('nama_tpk')->nullable();
            $table->string('unsur_tpk')->nullable();

            // Kontrasepsi Ibu
            $table->string('penggunaan_kontrasepsi');
            $table->string('metode_kb')->nullable();
            $table->string('alasan_tidak_kb')->nullable();

            // Data Anak
            $table->integer('usia_anak_bulan');
            $table->string('kriteria_baduta');
            $table->string('pemberian_asi');
            $table->string('riwayat_asi_setelah_6_bulan')->nullable();

            // Kondisi Bayi Baru Lahir
            $table->integer('usia_kehamilan_saat_lahir');
            $table->decimal('berat_badan_lahir', 4, 2);
            $table->decimal('panjang_badan_lahir', 4, 1);
            $table->decimal('lingkar_kepala_lahir', 4, 1);
            $table->string('mengalami_asfiksia', 10);

            // Kondisi & Pengukuran Saat Ini
            $table->date('tanggal_pengukuran');
            $table->decimal('berat_badan_saat_ini', 4, 2);
            $table->decimal('panjang_badan_saat_ini', 4, 1);
            $table->decimal('lingkar_kepala_saat_ini', 4, 1);
            $table->decimal('berat_badan_bulan_lalu', 4, 2)->nullable();
            $table->decimal('tinggi_badan_bulan_lalu', 4, 1)->nullable();
            $table->decimal('lingkar_kepala_bulan_lalu', 4, 1)->nullable();

            $table->decimal('zscore_bb_u', 4, 2)->nullable();
            $table->decimal('zscore_tb_u', 4, 2)->nullable();
            $table->decimal('zscore_bb_tb', 4, 2)->nullable();

            // Kesehatan & Imunisasi
            $table->string('mengisi_kka', 10);
            $table->string('imunisasi_dasar_lengkap');
            $table->string('alasan_imunisasi_tidak_lengkap')->nullable();
            $table->string('kehadiran_posyandu_bkb', 10);
            $table->string('paparan_asap_rokok', 20);
            $table->text('sumber_paparan_asap_rokok')->nullable();
            $table->string('sumber_paparan_lainnya')->nullable();

            // Intervensi Gizi & Elsimil
            $table->string('mendapatkan_mbg_3b', 10);
            $table->string('mendapatkan_pmt', 30);
            $table->string('sumber_pmt')->nullable();
            $table->integer('lama_menerima_pmt_hari')->nullable();
            $table->text('progres_setelah_pmt')->nullable();
            $table->string('input_elsimil', 10);
            $table->string('hasil_skrining_elsimil')->nullable();
            $table->string('unggah_screenshot_elsimil')->nullable();

            // Lingkungan & Fasilitasi
            $table->string('sumber_air_minum_utama');
            $table->string('fasilitas_jamban');
            $table->string('unggah_foto_depan_rumah')->nullable();
            $table->string('unggah_foto_jamban')->nullable();

            $table->string('fasilitasi_bantuan_sosial');
            $table->string('menerima_bantuan_sanitasi', 30);
            $table->string('sumber_bantuan_sanitasi')->nullable();
            $table->string('sumber_bantuan_sanitasi_lainnya')->nullable();
            $table->decimal('nilai_bantuan_sanitasi', 15, 2)->nullable();

            $table->string('memberikan_penyuluhan');
            $table->text('penyuluhan_kie')->nullable();
            $table->string('fasilitasi_rujukan_faskes');
            $table->string('sasaran_mudah_ditemui', 10);
            $table->string('sasaran_kooperatif', 10);
            $table->text('catatan')->nullable();

            $table->json('faktor_risiko')->nullable();
            $table->string('berisiko', 20);
            $table->timestamps();
        });

        // 3. Tabel Rencana Tindak Lanjut Risiko Baduta
        Schema::create('baduta_tindak_lanjuts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('baduta_kunjungan_id')->constrained('baduta_kunjungans')->cascadeOnDelete();
            $table->string('faktor_risiko');
            $table->text('identifikasi_penyebab')->nullable();
            $table->string('progres', 20)->nullable();
            $table->string('tindak_lanjut', 30)->nullable();
            $table->text('alasan_belum_dilaksanakan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('baduta_tindak_lanjuts');
        Schema::dropIfExists('baduta_kunjungans');
        Schema::dropIfExists('baduta_masters');
    }
};