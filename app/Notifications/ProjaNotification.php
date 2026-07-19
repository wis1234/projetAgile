<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class ProjaNotification extends Notification
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

    /**
     * Canaux utilisés.
     */
    public function via($notifiable)
    {
        return [
            'database',
            WebPushChannel::class,
        ];
    }

    /**
     * Notification enregistrée en base.
     */
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

    /**
     * Notification Push navigateur.
     */
    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->body($this->message)
            ->icon($this->icon ?? '/logo.png')
            ->tag($this->tag ?? 'proja')
            ->data([
                'url' => $this->url,
            ]);
    }
}