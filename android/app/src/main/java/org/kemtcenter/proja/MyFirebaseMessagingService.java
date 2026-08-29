package org.kemtcenter.proja;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Service FCM custom. Remplace celui du plugin @capacitor/push-notifications
 * (voir AndroidManifest.xml : tools:node="replace" sur le <service> du plugin).
 *
 * Attend des messages "data-only" envoyés par le backend Laravel, avec un
 * champ "type" pour distinguer un appel entrant d'une notification classique :
 *
 *   { "type": "call", "projectId": "...", "projectName": "...", "initiatorName": "...", "inviteUrl": "..." }
 *   { "type": "message", "title": "...", "body": "...", "url": "..." }
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CALL_CHANNEL_ID = "calls_channel";
    private static final String DEFAULT_CHANNEL_ID = "default_channel";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Le plugin Capacitor écoute déjà cet événement via son propre listener JS
        // (window.addEventListener('pushNotificationRegistration', ...)) donc rien
        // à faire ici de plus : Capacitor gère l'enregistrement du token côté JS.
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        if (data == null || data.isEmpty()) {
            return;
        }

        String type = data.get("type");

        if ("call".equals(type)) {
            showIncomingCallNotification(data);
        } else {
            showDefaultNotification(data);
        }
    }

    private void showIncomingCallNotification(Map<String, String> data) {
        createChannelsIfNeeded();

        Intent fullScreenIntent = new Intent(this, IncomingCallActivity.class);
        fullScreenIntent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        fullScreenIntent.putExtra("projectId", data.get("projectId"));
        fullScreenIntent.putExtra("projectName", data.get("projectName"));
        fullScreenIntent.putExtra("initiatorName", data.get("initiatorName"));
        fullScreenIntent.putExtra("inviteUrl", data.get("inviteUrl"));

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                0,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.sym_call_incoming)
                .setContentTitle(data.get("initiatorName") + " vous appelle")
                .setContentText(data.get("projectName"))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setAutoCancel(true)
                .setOngoing(true);

        NotificationManagerCompat.from(this).notify(1001, builder.build());

        // Lance aussi directement l'activité si l'app est déjà en foreground
        startActivity(fullScreenIntent);
    }

    private void showDefaultNotification(Map<String, String> data) {
        createChannelsIfNeeded();

        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (data.get("url") != null) {
            intent.putExtra("notificationUrl", data.get("url"));
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, DEFAULT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(data.get("title") != null ? data.get("title") : "ProJA")
                .setContentText(data.get("body"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setSound(defaultSound)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        NotificationManagerCompat.from(this).notify((int) System.currentTimeMillis(), builder.build());
    }

    private void createChannelsIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel callChannel = new NotificationChannel(
                CALL_CHANNEL_ID,
                "Appels entrants",
                NotificationManager.IMPORTANCE_HIGH
        );
        callChannel.setDescription("Notifications d'appel ProJA (LiveKit)");
        callChannel.enableVibration(true);
        callChannel.setVibrationPattern(new long[]{0, 400, 200, 400, 200, 400});
        manager.createNotificationChannel(callChannel);

        NotificationChannel defaultChannel = new NotificationChannel(
                DEFAULT_CHANNEL_ID,
                "Notifications générales",
                NotificationManager.IMPORTANCE_HIGH
        );
        defaultChannel.setDescription("Activités, messages et notifications ProJA");
        manager.createNotificationChannel(defaultChannel);
    }
}