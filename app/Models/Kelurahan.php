<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kelurahan extends Model
{
    protected $table = 'kelurahans';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'kemantren_id',
        'nama',
    ];

    public function kemantren(): BelongsTo
    {
        return $this->belongsTo(Kemantren::class, 'kemantren_id', 'id');
    }

    public function catinMasters(): HasMany
    {
        return $this->hasMany(CatinMaster::class, 'kelurahan_id', 'id');
    }
}