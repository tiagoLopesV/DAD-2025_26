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
        'photo_avatar' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048', // new: uploaded photo
    ]);

    if (!empty($validated['password'])) {
        $validated['password'] = Hash::make($validated['password']);
    } else {
        unset($validated['password']);
    }

if ($request->hasFile('photo_avatar')) {
    $file = $request->file('photo_avatar');
    $extension = $file->getClientOriginalExtension() ?: 'png'; // fallback
    $filename = str_pad($user->id, 5, '0', STR_PAD_LEFT) . '_' . uniqid() . '.' . $extension;
    $file->storeAs('public/photos_avatars', $filename);
    $validated['photo_avatar_filename'] = $filename;
} else if (!$user->photo_avatar_filename) {
    $validated['photo_avatar_filename'] = 'anonymous.png'; // default
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
