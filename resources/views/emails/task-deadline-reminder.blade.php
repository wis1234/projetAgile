@extends('emails.layouts.proja-notification')

@section('email_title', 'Rappel d’échéance : '.$task->title)
@section('header_title', 'Rappel d’échéance de tâche')

@section('content')
    @php
        $firstName = $notifiable->name ? explode(' ', $notifiable->name)[0] : 'Utilisateur';
        $dueDate = $task->due_date
            ? \Carbon\Carbon::parse($task->due_date)->setTimezone('Africa/Lagos')
            : null;
        $projectName = $task->project->name ?? 'Sans projet';
        $priorityLabels = [
            'high' => 'Priorité haute',
            'medium' => 'Priorité moyenne',
            'low' => 'Priorité basse',
            'basse' => 'Priorité basse',
            'moyenne' => 'Priorité moyenne',
            'haute' => 'Priorité haute',
        ];
    @endphp

    <p class="greeting">Bonjour <strong>{{ $firstName }}</strong>,</p>
    <p class="intro">
        La tâche <strong>{{ $task->title }}</strong> est à rendre
        <strong>{{ $timeLeft }}</strong>.
    </p>

    <section class="info-card">
        <h2 class="info-title">{{ $task->title }}</h2>
        <div class="info-row">
            <span class="info-label">Projet</span>
            <span class="info-value">{{ $projectName }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Date limite</span>
            <span class="info-value">
                {{ $dueDate?->format('d/m/Y H:i') ?? 'Non définie' }}
                @if($dueDate) (Fuseau horaire : UTC+1) @endif
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">Priorité</span>
            <span class="info-value">{{ $priorityLabels[$task->priority] ?? $task->priority }}</span>
        </div>
    </section>

    <p class="note">Merci d’utiliser {{ config('app.name') }} pour suivre vos tâches.</p>
@endsection

@section('action')
    <a class="button" href="{{ route('tasks.show', $task->id) }}">Voir la tâche</a>
@endsection

@section('footer_link')
    <p>Si le bouton ne fonctionne pas, ouvrez ce lien :</p>
    <p><a href="{{ route('tasks.show', $task->id) }}">{{ route('tasks.show', $task->id) }}</a></p>
@endsection
