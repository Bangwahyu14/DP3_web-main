<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BadutaMaster extends Model
{
    use HasFactory;

    protected $fillable = [
        'nik_anak', 'nama_anak', 'tanggal_lahir_anak', 'jenis_kelamin_anak',
        'anak_ke', 'tanggal_lahir_anak_sebelumnya', 'nik_ibu', 'nama_ibu',
        'tanggal_lahir_ibu', 'nomor_whatsapp_ibu', 'alamat', 'rt', 'rw',
        'domisili_min_6_bulan', 'kemantren_id', 'kelurahan_id', 'created_by', 'status_risiko'
    ];

    public function kemantren(): BelongsTo
    {
        return $this->belongsTo(Kemantren::class, 'kemantren_id');
    }

    public function kelurahan(): BelongsTo
    {
        return $this->belongsTo(Kelurahan::class, 'kelurahan_id');
    }

    public function kader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function kunjungans(): HasMany
    {
        return $this->hasMany(BadutaKunjungan::class, 'baduta_master_id')->latest();
    }
}