package org.kemtcenter.proja;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Pont natif -> JS pour transmettre les infos d'un appel LiveKit accepté
 * depuis IncomingCallActivity.
 *
 * Deux cas de figure :
 *  - COLD START (app pas en mémoire) : MainActivity est créée directement
 *    avec l'intent de réponse. Le JS appelle getPendingCall() une fois
 *    prêt pour récupérer ces infos.
 *  - WARM START (app déjà lancée) : MainActivity.onNewIntent() reçoit le
 *    nouvel intent et appelle notifyCallAnswered() pour pousser
 *    l'événement "callAnswered" directement au JS.
 */
@CapacitorPlugin(name = "CallBridge")
public class CallBridgePlugin extends Plugin {

    @PluginMethod
    public void getPendingCall(PluginCall call) {
        Intent intent = getActivity().getIntent();

        String projectId = intent.getStringExtra("answeredCallProjectId");
        String inviteUrl = intent.getStringExtra("answeredCallInviteUrl");

        JSObject ret = new JSObject();
        ret.put("projectId", projectId);
        ret.put("inviteUrl", inviteUrl);
        call.resolve(ret);

        // Evite de retraiter le meme appel si getPendingCall() est
        // rappelé plus tard (ex: hot reload JS en dev).
        intent.removeExtra("answeredCallProjectId");
        intent.removeExtra("answeredCallInviteUrl");
    }

    /**
     * Appelé depuis MainActivity.onNewIntent() (app déjà ouverte).
     */
    public void notifyCallAnswered(String projectId, String inviteUrl) {
        JSObject data = new JSObject();
        data.put("projectId", projectId);
        data.put("inviteUrl", inviteUrl);
        notifyListeners("callAnswered", data);
    }
}