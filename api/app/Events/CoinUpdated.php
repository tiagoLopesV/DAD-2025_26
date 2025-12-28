<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class CoinUpdated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $userId;
    public $balance;

    public function __construct(int $userId, int $balance)
    {
        $this->userId = $userId;
        $this->balance = $balance;
    }

    public function broadcastOn()
    {
        // Only the relevant user listens to this private channel
        return new PrivateChannel('coins.' . $this->userId);
    }

    public function broadcastAs()
    {
        return 'coin-updated';
    }
}
