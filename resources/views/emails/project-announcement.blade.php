@extends('emails.layouts.proja-notification')

@section('email_title', 'Nouveau communiqué dans '.$project->name)
@section('header_title', 'Nouveau communiqué de projet')

@section('content')
    @php
        $firstName = $notifiable->name ? explode(' ', $notifiable->name)[0] : 'Utilisateur';
    @endphp

    <p class="greeting">Bonjour <strong>{{ $firstName }}</strong>,</p>
    <p class="intro">
        <strong>{{ $authorName }}</strong> a publié un nouveau communiqué pour le projet
        <strong>{{ $project->name }}</strong>.
    </p>

    <section class="info-card">
        <h2 class="info-title">{{ $announcement->title }}</h2>
        <div class="info-row">
            <span class="info-label">Message</span>
            <div class="info-value" style="font-weight: 400; white-space: pre-wrap;">{{ $announcement->body }}</div>
        </div>
        <div class="info-row">
            <span class="info-label">Publié par</span>
            <span class="info-value">{{ $authorName }}</span>
        </div>
    </section>

    <p class="note">Vous recevez cet email car vous êtes membre de ce projet.</p>
@endsection

@section('action')
    <a class="button" href="{{ $projectUrl }}">Voir le communiqué</a>
@endsection

@section('footer_link')
    <p>Si le bouton ne fonctionne pas, ouvrez ce lien :</p>
    <p><a href="{{ $projectUrl }}">{{ $projectUrl }}</a></p>
@endsection
