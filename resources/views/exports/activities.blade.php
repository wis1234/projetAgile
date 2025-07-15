<table>
    <thead>
        <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Type</th>
            <th>Description</th>
            <th>Objet</th>
            <th>IP</th>
        </tr>
    </thead>
    <tbody>
        @foreach($activities as $activity)
            <tr>
                <td>{{ $activity->created_at }}</td>
                <td>{{ $activity->user ? $activity->user->name : 'Invité' }}</td>
                <td>{{ $activity->type }}</td>
                <td>{{ $activity->description }}</td>
                <td>{{ $activity->subject_type ? class_basename($activity->subject_type) . ' #' . $activity->subject_id : '-' }}</td>
                <td>{{ $activity->ip_address }}</td>
            </tr>
        @endforeach
    </tbody>
</table> 