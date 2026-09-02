package org.kemtcenter.proja;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationManagerCompat;

/**
 * Écran plein écran d'appel entrant (réveille l'appareil même verrouillé),
 * inspiré du comportement WhatsApp. Se ferme et redirige vers MainActivity
 * (qui gère l'appel LiveKitCallModal côté web) si l'utilisateur répond.
 */
public class IncomingCallActivity extends AppCompatActivity {

    private MediaPlayer ringtonePlayer;
    private Vibrator vibrator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Réveille l'écran et affiche par-dessus le verrouillage, comme un appel natif
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        String projectId = getIntent().getStringExtra("projectId");
        String projectName = getIntent().getStringExtra("projectName");
        String initiatorName = getIntent().getStringExtra("initiatorName");
        String inviteUrl = getIntent().getStringExtra("inviteUrl");

        setContentView(buildSimpleLayout(initiatorName, projectName, projectId, inviteUrl));

        startRingtoneAndVibration();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    /**
     * Layout construit en code pour éviter d'ajouter un fichier XML séparé.
     * Remplace par un layout XML custom si tu veux un design plus élaboré.
     */
    private LinearLayout buildSimpleLayout(String initiatorName, String projectName, String projectId, String inviteUrl) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(48, 200, 48, 48);
        root.setGravity(android.view.Gravity.CENTER_HORIZONTAL);

        TextView title = new TextView(this);
        title.setText(initiatorName != null ? initiatorName : "Appel entrant");
        title.setTextSize(24);
        title.setPadding(0, 0, 0, 16);

        TextView subtitle = new TextView(this);
        subtitle.setText(projectName != null ? projectName : "");
        subtitle.setTextSize(16);
        subtitle.setPadding(0, 0, 0, 64);

        Button answerButton = new Button(this);
        answerButton.setText("Répondre");
        answerButton.setOnClickListener(v -> {
            stopRingtoneAndVibration();
            NotificationManagerCompat.from(this).cancel(1001);

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("answeredCallProjectId", projectId);
            intent.putExtra("answeredCallInviteUrl", inviteUrl);
            startActivity(intent);
            finish();
        });

        Button declineButton = new Button(this);
        declineButton.setText("Refuser");
        declineButton.setOnClickListener(v -> {
            stopRingtoneAndVibration();
            NotificationManagerCompat.from(this).cancel(1001);
            finish();
        });

        root.addView(title);
        root.addView(subtitle);
        root.addView(answerButton);
        root.addView(declineButton);

        return root;
    }

    private void startRingtoneAndVibration() {
        try {
            Uri ringtoneUri = Uri.parse("android.resource://" + getPackageName() + "/" + android.provider.Settings.System.DEFAULT_RINGTONE_URI);
            ringtonePlayer = new MediaPlayer();
            ringtonePlayer.setDataSource(this, android.provider.Settings.System.DEFAULT_RINGTONE_URI);
            ringtonePlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
            );
            ringtonePlayer.setLooping(true);
            ringtonePlayer.prepare();
            ringtonePlayer.start();
        } catch (Exception e) {
            // Pas bloquant si la sonnerie système échoue
        }

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 400, 200, 400, 200, 400};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }
    }

    private void stopRingtoneAndVibration() {
        if (ringtonePlayer != null) {
            ringtonePlayer.stop();
            ringtonePlayer.release();
            ringtonePlayer = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRingtoneAndVibration();
    }
}