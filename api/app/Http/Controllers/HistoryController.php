<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Game;
use Illuminate\Support\Facades\DB;

class HistoryController extends Controller
{
    public function myHistory(Request $request)
    {
        $user = $request->user();

        $games = Game::where('player1_user_id', $user->id)
            ->orWhere('player2_user_id', $user->id)
            ->with(['winner'])
            ->orderBy('began_at', 'desc')
            ->paginate(20);

        
        return response()->json($games);
    }
    
    public function allHistory(Request $request)
    {
        // Admin only - handled by route middleware
        $games = Game::with(['winner', 'player1', 'player2']) // Assuming relationships exist
            ->orderBy('began_at', 'desc')
            ->paginate(20);
            
        return response()->json($games);
    }
}
