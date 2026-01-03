<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\GameMatch;

class Game extends Model
{
    use HasFactory;

    public $timestamps = false;

    /**
     * Campos que podem ser preenchidos em massa.
     */
    protected $fillable = [
        'type',
        'player1_user_id',
        'player2_user_id',
        'is_draw',
        'winner_user_id',
        'loser_user_id',
        'match_id',
        'status',
        'began_at',
        'ended_at',
        'total_time',
        'player1_points',
        'player2_points',
        'custom',
    ];

    /**
     * Casts para garantir tipos de dados corretos.
     */
    protected $casts = [
        'is_draw' => 'boolean',
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'player1_points' => 'integer',
        'player2_points' => 'integer',
        'total_time' => 'integer',
        'custom' => 'array', // Converte o JSON da DB em array PHP automaticamente
    ];

    // --- RELAÇÕES ---

    /**
     * Jogador 1 (Criador)
     */
    public function player1(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    /**
     * Jogador 2 (Adversário)
     */
    public function player2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    /**
     * Vencedor do jogo
     */
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    /**
     * Perdedor do jogo
     */
    public function loser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'loser_user_id');
    }

    /**
     * Match ao qual este jogo pertence (se aplicável)
     */
    public function match(): BelongsTo
    {
        return $this->belongsTo(GameMatch::class, 'match_id');
    }
}