<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'nickname',
        'type', // P = player, A = Admin
        'photo_avatar_filename',
        'coins_balance',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'blocked' => 'boolean',
    ];

    public function isAdmin(): bool {
        return $this->type === 'A';
    }

    public function coinTransactions() {
        return $this->hasMany(CoinTransaction::class);
    }

    public function gamesWon() {
        return $this->hasMany(Game::class, 'winner_user_id');
    }

    /**
     * Override authentication to ignore soft-deleted users
     */
    public function getAuthIdentifierName()
    {
        return 'email';
    }

    public function newQuery($excludeDeleted = true)
    {
        $builder = parent::newQuery($excludeDeleted);
        if ($excludeDeleted) {
            $builder->whereNull('deleted_at');
        }
        return $builder;
    }
}
