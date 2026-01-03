<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    public function publicStats()
    {
        // Totals
        $totalPlayers = User::count();
        $totalGames = Game::count();
        $totalMatches = DB::table('matches')->count(); 

        // Recent Activity (last 7 days)
        $endDate = now();
        $startDate = now()->subDays(6)->startOfDay();

        $games = Game::where('began_at', '>=', $startDate)
            ->where('began_at', '<=', $endDate)
            ->orderBy('began_at')
            ->get(['began_at']);
            
        $gamesLast7Days = $games->groupBy(function ($game) {
            return $game->began_at ? $game->began_at->format('Y-m-d') : 'Unknown';
        })->map(function ($dayGames) {
            return count($dayGames);
        });

        // Ensure all 7 days are present, even if count is 0
        $chartData = collect();
        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i)->format('Y-m-d');
            $chartData->push([
                'date' => $date,
                'count' => $gamesLast7Days->get($date, 0)
            ]);
        }

        // Games status distribution
        $gamesByStatus = Game::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->makeHidden(['winner', 'player1', 'player2']); // Ensure no extra relations are loaded/shown

        return response()->json([
            'total_players' => $totalPlayers,
            'total_games' => $totalGames,
            'total_matches' => $totalMatches,
            'games_last_7_days' => $chartData,
            'games_by_status' => $gamesByStatus,
        ]);
    }
}
