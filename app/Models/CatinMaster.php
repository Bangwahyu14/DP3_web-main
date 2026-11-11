<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatinMaster extends Model
{
    use HasFactory;

    protected $fillable = [
        'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'tanggal_lahir_pria',
        'no_wa', 'no_wa_pria', 'alamat', 'rt', 'rw', 'tempat_tinggal_domisili',
        'kelurahan_domisili', 'kecamatan_domisili', 'kota_domisili', 'provinsi_domisili',
        'kelurahan_id', 'created_by', 'status_risiko'
    ];

    public function kelurahan(): BelongsTo
    {
        return $this->belongsTo(Kelurahan::class, 'kelurahan_id', 'id');
    }

    public function kader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function kunjungans(): HasMany
    {
        return $this->hasMany(CatinKunjungan::class)->orderBy('tanggal_kunjungan', 'desc');
    }
}