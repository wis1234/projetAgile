<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Résultats cumulés – {{ $meta['title'] }}</title>
    @include('exports.quiz-pdf-styles')
</head>
<body>
    <div class="footer">ProJA – Résultats cumulés « {{ $meta['title'] }} » – généré le {{ $meta['generated_at'] }}</div>

    <div class="header">
        <div class="brand">ProJA · Résultats cumulés</div>
        <h1>{{ $meta['title'] }}</h1>
        <div class="sub">Projet : {{ $meta['project'] }} · Généré le {{ $meta['generated_at'] }}</div>
        <div style="margin-top:6px">
            <span class="badge {{ $meta['validated'] ? 'badge-ok' : 'badge-warn' }}">{{ $meta['status_label'] }}</span>
        </div>
    </div>

    <p class="small" style="margin:0 0 8px 0">
        <strong>Calcul :</strong> moyenne générale = Σ (note × coefficient) ÷ Σ coefficients
        · quiz non passé : {{ $data['method']['missing_policy'] === 'ignore' ? 'ignoré' : 'compté pour 0' }}
        · bonus de participation : {{ $data['method']['include_bonus'] ? 'ajouté (plafond ' . $data['method']['bonus_cap'] . ' pts)' : 'non pris en compte' }}.
    </p>

    <table class="stats"><tr>
        <td><div class="v">{{ $data['stats']['total'] }}</div><div class="l">Candidats</div></td>
        <td><div class="v">{{ $data['stats']['average'] !== null ? number_format($data['stats']['average'], 2, ',', ' ') . ' %' : '—' }}</div><div class="l">Moyenne</div></td>
        <td><div class="v">{{ $data['stats']['highest'] !== null ? number_format($data['stats']['highest'], 2, ',', ' ') . ' %' : '—' }}</div><div class="l">Meilleure note</div></td>
        <td><div class="v">{{ $data['stats']['pass_rate'] !== null ? $data['stats']['pass_rate'] . ' %' : '—' }}</div><div class="l">Réussite</div></td>
    </tr></table>

    <table class="grid">
        <thead>
            <tr>
                <th style="width:34px">Rang</th>
                <th class="left">Candidat</th>
                @foreach($data['quizzes'] as $q)
                    <th>{{ $q['title'] }}<br><span style="font-weight:normal;font-size:7pt">coef. {{ $q['coefficient'] }}</span></th>
                @endforeach
                <th>Moyenne</th>
                <th>Bonus</th>
                <th>Note finale</th>
                <th>Décision</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['rows'] as $r)
                @php $notes = (array) $r['notes']; @endphp
                <tr class="{{ ($r['rank'] ?? null) === 1 ? 'top1' : '' }}">
                    <td class="rank">{{ $r['rank'] ?? '—' }}</td>
                    <td class="left"><strong>{{ $r['name'] }}</strong></td>
                    @foreach($data['quizzes'] as $q)
                        <td>{{ array_key_exists($q['id'], $notes) ? number_format($notes[$q['id']], 2, ',', ' ') : ($r['is_pending'] ? '…' : 'Abs.') }}</td>
                    @endforeach
                    <td>{{ $r['average'] !== null ? number_format($r['average'], 2, ',', ' ') : '—' }}</td>
                    <td>{{ $r['bonus'] > 0 ? '+' . number_format($r['bonus'], 2, ',', ' ') : '0' }}</td>
                    <td class="final">{{ $r['is_pending'] ? '—' : number_format($r['final'], 2, ',', ' ') . ' %' }}</td>
                    <td class="{{ $r['is_pending'] ? 'pend' : ($r['passed'] ? 'pass' : 'fail') }}">
                        {{ $r['is_pending'] ? 'En attente' : ($r['passed'] ? 'Admis(e)' : 'Ajourné(e)') }}
                    </td>
                </tr>
                <tr>
                    <td></td>
                    <td class="left small" colspan="{{ count($data['quizzes']) + 5 }}">↳ {{ $r['calculation'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
