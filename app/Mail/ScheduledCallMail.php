<?php
namespace App\Mail;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\ScheduledCall;

class ScheduledCallMail extends Mailable {
    use Queueable, SerializesModels;
    public $schedule;
    public $type;
    public function __construct(ScheduledCall $schedule, string $type) {
        $this->schedule = $schedule;
        $this->type = $type;
    }
    public function build() {
        $subject = $this->type === 'reminder' 
            ? "Rappel : Appel ProJA Meet dans 1 heure" 
            : "L'appel ProJA Meet commence maintenant !";
        return $this->subject($subject)->view('emails.scheduled-call');
    }
}
