<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Résultats – {{ $meta['title'] }}</title>
    @include('exports.quiz-pdf-styles')
</head>
<body>
    <div class="footer">ProJA – Résultats « {{ $meta['title'] }} » – généré le {{ $meta['generated_at'] }}</div>

    <div class="header">
        <div class="brand">ProJA · Résultats {{ $meta['validated'] ? 'officiels' : 'provisoires' }}</div>
        <h1>{{ $meta['title'] }}</h1>
        <div class="sub">Projet : {{ $meta['project'] }} · Généré le {{ $meta['generated_at'] }}</div>
        <div style="margin-top:6px">
            <span class="badge {{ $meta['validated'] ? 'badge-ok' : 'badge-warn' }}">{{ $meta['status_label'] }}</span>
        </div>
    </div>

    @unless($meta['validated'])
        <div class="watermark">Ces résultats n'ont pas encore été validés en délibération : ils peuvent encore évoluer.</div>
    @endunless

    <table class="stats"><tr>
        <td><div class="v">{{ $stats['total'] }}</div><div class="l">Candidats</div></td>
        <td><div class="v">{{ $stats['average'] !== null ? number_format($stats['average'], 2, ',', ' ') . ' %' : '—' }}</div><div class="l">Moyenne</div></td>
        <td><div class="v">{{ $stats['highest'] !== null ? number_format($stats['highest'], 2, ',', ' ') . ' %' : '—' }}</div><div class="l">Meilleure note</div></td>
        <td><div class="v">{{ $stats['pass_rate'] !== null ? $stats['pass_rate'] . ' %' : '—' }}</div><div class="l">Réussite</div></td>
    </tr></table>

    <table class="grid">
        <thead>
            <tr>
                <th style="width:36px">Rang</th>
                <th class="left">Candidat</th>
                <th>QCM</th>
                <th>Écrit</th>
                <th>Note quiz</th>
                <th>Bonus</th>
                <th>Note finale</th>
                <th>Décision</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $r)
                <tr class="{{ ($r['rank'] ?? null) === 1 ? 'top1' : '' }}">
                    <td class="rank">{{ $r['rank'] ?? '—' }}</td>
                    <td class="left"><strong>{{ $r['name'] }}</strong>@if($r['email'])<br><span class="small">{{ $r['email'] }}</span>@endif</td>
                    <td>{{ $r['qcm_percent'] !== null ? number_format($r['qcm_percent'], 1, ',', ' ') . ' %' : '–' }}</td>
                    <td>{{ $r['written_percent'] !== null ? number_format($r['written_percent'], 1, ',', ' ') . ' %' : '–' }}</td>
                    <td>{{ $r['is_pending'] ? '—' : number_format($r['score'], 2, ',', ' ') . ' %' }}</td>
                    <td>{{ $r['bonus'] > 0 ? '+' . number_format($r['bonus'], 2, ',', ' ') : '0' }}</td>
                    <td class="final">{{ $r['is_pending'] ? '—' : number_format($r['final'], 2, ',', ' ') . ' %' }}</td>
                    <td class="{{ $r['is_pending'] ? 'pend' : ($r['passed'] ? 'pass' : 'fail') }}">
                        {{ $r['is_pending'] ? 'En attente' : ($r['passed'] ? 'Admis(e)' : 'Ajourné(e)') }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="small" style="margin-top:8px">
        Note finale = note du quiz + bonus de participation (plafonné à {{ config('quiz.participation_cap') }} points), limitée à 100 %.
        Seuil d'admission : {{ config('quiz.pass_mark') }} %.
    </p>

    @if(!empty($meta['approvers']))
        <table class="sign"><tr>
            @foreach($meta['approvers'] as $a)
                <td>
                    <strong>{{ $a['name'] }}</strong><br>
                    <span class="small">Aval donné numériquement<br>le {{ $a['approved_at'] }}</span>
                </td>
            @endforeach
        </tr></table>
    @endif
</body>
</html>
