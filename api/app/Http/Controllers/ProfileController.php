<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'nickname' => 'sometimes|string|max:50|unique:users,nickname,' . $user->id,
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:3|confirmed',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'password' => 'required',
        ]);

        if (! Hash::check($request->password, $request->user()->password)) {
            return response()->json(['message' => 'Invalid password'], 403);
        }

        // Admin cannot delete own account
        if ($request->user()->isAdmin()) {
            return response()->json(['message' => 'Admins cannot delete their own account'], 403);
        }

        $request->user()->delete();

        return response()->json(['message' => 'Account deleted']);
    }
}
