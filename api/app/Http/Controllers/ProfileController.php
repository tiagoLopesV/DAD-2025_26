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
            'photo_avatar' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048',
        ]);

        if ($request->filled('password')) {
            $request->validate([
                'password' => 'required|string|min:3|confirmed',
            ]);

            $user->password = Hash::make($request->password);
        }

        if ($request->hasFile('photo_avatar')) {
            $file = $request->file('photo_avatar');
            $extension = $file->getClientOriginalExtension() ?: 'png';
            $filename = str_pad($user->id, 5, '0', STR_PAD_LEFT) . '_' . uniqid() . '.' . $extension;
            $file->storeAs('public/photos_avatars', $filename);
            $user->photo_avatar_filename = $filename;
        } elseif (!$user->photo_avatar_filename) {
            $user->photo_avatar_filename = 'anonymous.png';
        }

        $user->update($validated);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'nickname' => $user->nickname,
            'email' => $user->email,
            'type' => $user->type,
            'blocked' => $user->blocked,
            'coins_balance' => $user->coins_balance,
            'custom' => $user->custom,
            'photo_avatar_filename' => $user->photo_avatar_filename,
            'photo_avatar_url' => url('storage/photos_avatars/' . $user->photo_avatar_filename),
        ]);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'password' => 'required',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid password'], 403);
        }

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Admins cannot delete their own account'], 403);
        }

        // Soft delete
        $user->delete();

        return response()->json(['message' => 'Account deleted']);
    }
}
