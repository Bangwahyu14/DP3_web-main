<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Identitas Dasar Catin
        Schema::create('catin_masters', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 16)->unique();
            $table->string('nama');
            $table->string('no_wa', 20)->nullable();
            $table->date('tanggal_lahir');
            $table->text('alamat');
            
            // Relasi ke wilayah (string/varchar) & pembuat data
            $table->string('kelurahan_id');
            $table->foreign('kelurahan_id')->references('id')->on('kelurahans')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            // Status evaluasi risiko stunting
            $table->enum('status_risiko', ['berisiko', 'tidak_berisiko', 'belum_skrining'])->default('belum_skrining');
            $table->timestamps();
        });

        // 2. Tabel Riwayat Kunjungan / Skrining Kader TPK
        Schema::create('catin_kunjungans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('catin_master_id')->constrained('catin_masters')->cascadeOnDelete();
            $table->foreignId('user_id')->comment('Kader pendamping')->constrained('users')->cascadeOnDelete();
            $table->date('tanggal_kunjungan');

            // Pengukuran Fisik & Lab
            $table->decimal('berat_badan', 5, 2);
            $table->decimal('tinggi_badan', 5, 2);
            $table->decimal('imt', 4, 2);
            $table->decimal('lila', 4, 1);
            $table->decimal('kadar_hb', 4, 1)->nullable();

            // Indikator Risiko Stunting Standar Kemenkes / BKKBN
            $table->boolean('is_kek')->default(false);
            $table->boolean('is_anemia')->default(false);
            $table->boolean('terpapar_rokok')->default(false);

            // Tindakan & Catatan Pendampingan
            $table->text('intervensi')->nullable();
            $table->text('catatan_kader')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catin_kunjungans');
        Schema::dropIfExists('catin_masters');
    }
};