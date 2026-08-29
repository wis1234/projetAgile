<?php

namespace App\Notifications;

use App\Notifications\Channels\ProjaWebPushChannel;
use App\Notifications\Channels\ProjaFcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ProjaNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected string $title;
    protected string $message;
    protected ?string $url;
    protected ?string $icon;
    protected ?string $tag;

    public function __construct(
        string $title,
        string $message,
        ?string $url = null,
        ?string $icon = null,
        ?string $tag = null,
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->url = $url;
        $this->icon = $icon;
        $this->tag = $tag;
    }

    public function via($notifiable)
    {
        return [
            'database',
            ProjaWebPushChannel::class,
            ProjaFcmChannel::class,
        ];
    }

    public function toDatabase($notifiable)
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
            'icon' => $this->icon,
            'tag' => $this->tag,
        ];
    }

    public function toWebPush($notifiable, $notification)
    {
        return [
            'title' => $this->title,
            'body'  => $this->message,
            'url'   => $this->url ?? '/dashboard',
            'icon'  => $this->icon ?? '/logo-proja.png',
            'tag'   => $this->tag ?? 'proja',
        ];
    }

    /**
     * Payload envoyé à ProjaFcmChannel → FcmService (push natif Android/iOS).
     */
    public function toFcm($notifiable)
    {
        return [
            'title' => $this->title,
            'body'  => $this->message,
            'url'   => $this->url ?? '/dashboard',
        ];
    }
}