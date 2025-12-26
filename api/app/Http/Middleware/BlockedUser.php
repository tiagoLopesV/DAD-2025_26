<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BlockedUser
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && $request->user()->blocked) {
            return response()->json([
                'message' => 'User is blocked'
            ], 403);
        }

        return $next($request);
    }
}
