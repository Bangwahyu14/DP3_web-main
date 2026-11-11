<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BumilMaster extends Model
{
    use HasFactory;

    protected $fillable = [
        'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'alamat',
        'rt', 'rw', 'nomor_whatsapp', 'domisili_min_6_bulan',
        'kemantren_id', 'kelurahan_id', 'created_by', 'status_risiko'
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
        return $this->hasMany(BumilKunjungan::class, 'bumil_master_id')->latest();
    }
}