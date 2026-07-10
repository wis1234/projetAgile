<x-mail::message>
# Alerte : Prolongation du délai du sprint

Bonjour,

Le délai initialement prévu pour le sprint **{{ $sprint->name }}** a été prolongé.  
L'ancienne date de fin était fixée au **{{ \Carbon\Carbon::parse($oldEndDate)->translatedFormat('d F Y à H:i') }}**, mais elle a été repoussée au **{{ \Carbon\Carbon::parse($sprint->end_date)->translatedFormat('d F Y à H:i') }}**.

### Tâches achevées jusqu'à ce jour :
@if($completedTasks->isNotEmpty())
<ul>
@foreach($completedTasks as $task)
<li>✅ {{ $task->title }}</li>
@endforeach
</ul>
@else
*Aucune tâche n'a été achevée pour l'instant.*
@endif

### Tâches non achevées :
@if($unfinishedTasks->isNotEmpty())
<ul>
@foreach($unfinishedTasks as $task)
<li>⏳ {{ $task->title }} ({{ $task->status === 'in_progress' ? 'En cours' : 'À faire' }})</li>
@endforeach
</ul>
@else
*Toutes les tâches sont terminées.*
@endif

---

**⚠️ Rappel important à l'attention de toute l'équipe :**  
Nous vous invitons à déployer tous les moyens nécessaires pour finaliser les tâches restantes. Un nouveau report de ce sprint risquerait de rallonger considérablement la durée globale d'exécution du projet. La collaboration et l'effort de chacun sont essentiels pour atteindre les objectifs dans les temps !

Merci pour votre implication,

L'équipe {{ config('app.name') }}
</x-mail::message>
