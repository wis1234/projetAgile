@extends('emails.layouts.proja-notification')

@section('email_title', 'Nouveau fichier sur la tâche '.$task->title)
@section('header_title', 'Nouveau fichier sur une tâche')

@section('content')
    @php
        $firstName = $notifiable->name ? explode(' ', $notifiable->name)[0] : 'Utilisateur';
        $projectName = $task->project->name ?? 'Sans projet';
    @endphp

    <p class="greeting">Bonjour <strong>{{ $firstName }}</strong>,</p>
    <p class="intro">
        <strong>{{ $uploader->name }}</strong> a téléversé un fichier sur la tâche
        <strong>{{ $task->title }}</strong> du projet <strong>{{ $projectName }}</strong>.
    </p>

    <section class="info-card">
        <h2 class="info-title">{{ $task->title }}</h2>
        <div class="info-row">
            <span class="info-label">Nom du fichier</span>
            <span class="info-value">{{ $file->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Type</span>
            <span class="info-value">{{ $file->type ?? 'FICHIER' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Taille</span>
            <span class="info-value">{{ number_format(($file->size ?? 0) / 1048576, 2) }} Mo</span>
        </div>
        <div class="info-row">
            <span class="info-label">Statut</span>
            <span class="info-value">
                @switch($file->status)
                    @case('pending') En attente @break
                    @case('approved') Approuvé @break
                    @case('rejected') Rejeté @break
                    @default {{ $file->status }}
                @endswitch
            </span>
        </div>
        <div class="info-row">
            <span class="info-label">Date de téléversement</span>
            <span class="info-value">{{ $file->created_at?->format('d/m/Y à H:i') }}</span>
        </div>
    </section>

    <p class="note">
        Vous recevez cette notification car vous êtes impliqué dans cette tâche.
    </p>
@endsection

@section('action')
    <a class="button" href="{{ route('tasks.show', $task->id) }}">Voir la tâche complète</a>
@endsection

@section('footer_link')
    <p>Si le bouton ne fonctionne pas, ouvrez ce lien :</p>
    <p><a href="{{ route('tasks.show', $task->id) }}">{{ route('tasks.show', $task->id) }}</a></p>
@endsection
