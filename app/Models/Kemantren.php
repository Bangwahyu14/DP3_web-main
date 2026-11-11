<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kemantren extends Model
{
    protected $table = 'kemantrens';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'nama',
    ];

    public function kelurahans(): HasMany
    {
        return $this->hasMany(Kelurahan::class, 'kemantren_id', 'id');
    }
}