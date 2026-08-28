package org.kemtcenter.proja;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;

    // Garde en mémoire la requête WebView en attente pendant qu'on demande
    // la permission système à l'utilisateur (le popup Android est async).
    private PermissionRequest pendingWebViewRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Remplace le WebChromeClient par défaut pour intercepter les
        // demandes de permission JS (getUserMedia) et les relayer au système Android.
        this.bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                String[] resources = request.getResources();
                boolean needsAudio = false;
                boolean needsVideo = false;

                for (String resource : resources) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                        needsAudio = true;
                    }
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                        needsVideo = true;
                    }
                }

                boolean audioGranted = !needsAudio || ContextCompat.checkSelfPermission(
                        MainActivity.this, Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED;

                boolean videoGranted = !needsVideo || ContextCompat.checkSelfPermission(
                        MainActivity.this, Manifest.permission.CAMERA
                ) == PackageManager.PERMISSION_GRANTED;

                if (audioGranted && videoGranted) {
                    // Déjà autorisé côté Android → on accorde directement à la WebView
                    runOnUiThread(() -> request.grant(resources));
                } else {
                    // Il manque une permission système → on la demande à l'utilisateur
                    pendingWebViewRequest = request;

                    java.util.List<String> toRequest = new java.util.ArrayList<>();
                    if (needsAudio && !audioGranted) toRequest.add(Manifest.permission.RECORD_AUDIO);
                    if (needsVideo && !videoGranted) toRequest.add(Manifest.permission.CAMERA);

                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            toRequest.toArray(new String[0]),
                            PERMISSION_REQUEST_CODE
                    );
                }
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                pendingWebViewRequest = null;
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSION_REQUEST_CODE && pendingWebViewRequest != null) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (allGranted) {
                pendingWebViewRequest.grant(pendingWebViewRequest.getResources());
            } else {
                pendingWebViewRequest.deny();
            }

            pendingWebViewRequest = null;
        }
    }
}