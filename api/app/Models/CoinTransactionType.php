<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinTransactionType extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'deleted_at', 'custom'];

    protected $casts = [
        'custom' => 'array',
    ];

    public function transactions() {
        return $this->hasMany(CoinTransaction::class);
    }
}
