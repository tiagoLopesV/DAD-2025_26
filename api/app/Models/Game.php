<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    public function winner()
    {
        return $this->belongsTo(User::class, "winner_user_id");
    }

        protected function casts(): array
    {
        return [
            'began_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }
}
