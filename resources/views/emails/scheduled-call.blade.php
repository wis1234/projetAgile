<p>Bonjour,</p>
<p>
@if($type === 'reminder')
    L'appel <strong>{{ $schedule->title ?: 'ProJA Meet' }}</strong> pour le projet <strong>{{ $schedule->project->name }}</strong> commencera dans environ 1 heure.
@else
    L'appel <strong>{{ $schedule->title ?: 'ProJA Meet' }}</strong> vient de commencer !
@endif
</p>
<p><a href="{{ url('/projects/'.$schedule->project_id) }}">Accéder au projet pour rejoindre</a></p>
