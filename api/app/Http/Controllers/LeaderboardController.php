<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    public function global(Request $request)
    {
        // Top players by Game Wins
        $gameWins = User::withCount(['gamesWon as wins'])
            ->orderByDesc('wins')
            ->orderBy('id') 
            ->limit(10)
            ->get(['id', 'nickname', 'photo_avatar_filename']);


        
        $matchWins = DB::table('matches')
            ->select('winner_user_id', DB::raw('count(*) as wins'))
            ->whereNotNull('winner_user_id')
            ->groupBy('winner_user_id')
            ->orderByDesc('wins')
            ->limit(10)
            ->join('users', 'matches.winner_user_id', '=', 'users.id')
            ->select('users.id', 'users.nickname', 'users.photo_avatar_filename', DB::raw('count(*) as wins'))
            ->groupBy('users.id', 'users.nickname', 'users.photo_avatar_filename')
            ->get();

        return response()->json([
            'most_games_won' => $gameWins,
            'most_matches_won' => $matchWins,
        ]);
    }

    public function personal(Request $request)
    {
        $user = $request->user();

        // Game Wins
        $gameWins3 = Game::where('winner_user_id', $user->id)->where('type', '3')->count();
        $gameWins9 = Game::where('winner_user_id', $user->id)->where('type', '9')->count();
        
        // Match Wins
        $matchWins = DB::table('matches')->where('winner_user_id', $user->id)->count();


        
        $marksAsP1 = DB::table('matches')->where('player1_user_id', $user->id)->sum('player1_marks');
        $marksAsP2 = DB::table('matches')->where('player2_user_id', $user->id)->sum('player2_marks');
        $totalMarks = $marksAsP1 + $marksAsP2;


        return response()->json([
            'game_wins_total' => $gameWins3 + $gameWins9,
            'game_wins_bisca_3' => $gameWins3,
            'game_wins_bisca_9' => $gameWins9,
            'match_wins' => $matchWins,
            'total_marks' => $totalMarks,
        ]);
    }
}
