<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatinKunjungan extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'sumber_paparan_rokok' => 'array',
        'sumber_air_minum' => 'array',
        'fasilitas_jamban' => 'array',
        'is_kek' => 'boolean',
        'is_anemia' => 'boolean',
        'terpapar_rokok' => 'boolean',
        'pria_merokok' => 'boolean',
        'dapat_ttd' => 'boolean',
        'minum_ttd' => 'boolean',
        'suplemen_makanan' => 'boolean',
        'mudah_ditemui' => 'boolean',
        'kooperatif' => 'boolean',
        'tanggal_kunjungan' => 'date',
        'tanggal_pemeriksaan' => 'date',
        'tgl_rencana_nikah' => 'date',
    ];

    public function catin(): BelongsTo
    {
        return $this->belongsTo(CatinMaster::class, 'catin_master_id');
    }

    public function kader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}