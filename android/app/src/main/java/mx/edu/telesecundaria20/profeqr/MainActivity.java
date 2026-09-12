package mx.edu.telesecundaria20.profeqr;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.ServiceWorkerClientCompat;
import androidx.webkit.ServiceWorkerControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String APP_URL = "https://" + APP_HOST + "/assets/www/index.html";
    private static final int FILE_CHOOSER_REQUEST = 4101;
    private static final int WEB_MEDIA_PERMISSION_REQUEST = 4102;
    private static final int SPEECH_PERMISSION_REQUEST = 4103;

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> fileChooserCallback;
    private PermissionRequest pendingWebPermission;
    private NativeSpeechBridge speechBridge;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(30, 58, 138));
        getWindow().setNavigationBarColor(Color.rgb(243, 246, 250));

        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
                && WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(new ServiceWorkerClientCompat() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return assetLoader.shouldInterceptRequest(request.getUrl());
                }
            });
        }

        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        speechBridge = new NativeSpeechBridge();
        webView.addJavascriptInterface(new NativeDownloadsBridge(), "AndroidDownloads");
        webView.addJavascriptInterface(speechBridge, "AndroidSpeech");
        webView.loadUrl(APP_URL);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) settings.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_HOST.equalsIgnoreCase(uri.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception error) {
                    Toast.makeText(MainActivity.this, "No se pudo abrir el enlace", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectNativeAdapters();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> requestWebPermissions(request));
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception error) {
                    fileChooserCallback = null;
                    Toast.makeText(MainActivity.this, "No se pudo abrir el selector de archivos", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
    }

    private void requestWebPermissions(PermissionRequest request) {
        Uri origin = request.getOrigin();
        if (origin == null || !APP_HOST.equalsIgnoreCase(origin.getHost())) {
            request.deny();
            return;
        }
        List<String> needed = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.CAMERA);
            }
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.RECORD_AUDIO);
            }
        }
        if (needed.isEmpty()) {
            grantAllowedWebResources(request);
            return;
        }
        pendingWebPermission = request;
        requestPermissions(needed.toArray(new String[0]), WEB_MEDIA_PERMISSION_REQUEST);
    }

    private void grantAllowedWebResources(PermissionRequest request) {
        List<String> allowed = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                allowed.add(resource);
            }
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                allowed.add(resource);
            }
        }
        if (allowed.isEmpty()) request.deny();
        else request.grant(allowed.toArray(new String[0]));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == WEB_MEDIA_PERMISSION_REQUEST && pendingWebPermission != null) {
            grantAllowedWebResources(pendingWebPermission);
            pendingWebPermission = null;
        }
        if (requestCode == SPEECH_PERMISSION_REQUEST && speechBridge != null) {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                speechBridge.startListeningNow();
            } else {
                speechBridge.dispatchError("not-allowed");
                speechBridge.dispatchEnd();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileChooserCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++) result[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileChooserCallback.onReceiveValue(result);
        fileChooserCallback = null;
    }

    private void injectNativeAdapters() {
        String script = "(function(){"
                + "if(window.__profeqrNativeReady)return;window.__profeqrNativeReady=true;"
                + "function saveLink(a){if(!a||!a.download||!a.href)return false;"
                + "if(a.href.indexOf('blob:')!==0&&a.href.indexOf('data:')!==0)return false;"
                + "Promise.resolve(a.href.indexOf('data:')===0?a.href:fetch(a.href).then(function(r){return r.blob();}).then(function(b){return new Promise(function(ok,fail){var f=new FileReader();f.onload=function(){ok(f.result);};f.onerror=fail;f.readAsDataURL(b);});}))"
                + ".then(function(data){AndroidDownloads.saveDataUrl(a.download||'archivo',data);})"
                + ".catch(function(){AndroidDownloads.showError();});return true;}"
                + "var originalClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(saveLink(this))return;return originalClick.apply(this,arguments);};"
                + "document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[download]'):null;if(saveLink(a)){e.preventDefault();e.stopImmediatePropagation();}},true);"
                + "var active=null;function NativeRecognition(){this.lang='es-MX';this.interimResults=true;this.continuous=true;this.maxAlternatives=1;this.onresult=null;this.onerror=null;this.onend=null;}"
                + "NativeRecognition.prototype.start=function(){active=this;AndroidSpeech.start();};NativeRecognition.prototype.stop=function(){if(active===this)active=null;AndroidSpeech.stop();};"
                + "window.__profeqrSpeechResult=function(text,isFinal){if(!active||!active.onresult)return;var alt={transcript:text,confidence:1};var result=[alt];result.isFinal=!!isFinal;active.onresult({resultIndex:0,results:[result]});};"
                + "window.__profeqrSpeechError=function(code){if(active&&active.onerror)active.onerror({error:code});};"
                + "window.__profeqrSpeechEnd=function(){var current=active;if(current&&current.onend)current.onend();};"
                + "window.SpeechRecognition=NativeRecognition;window.webkitSpeechRecognition=NativeRecognition;"
                + "})();";
        webView.evaluateJavascript(script, null);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (speechBridge != null) speechBridge.destroy();
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidDownloads");
            webView.removeJavascriptInterface("AndroidSpeech");
            webView.destroy();
        }
        super.onDestroy();
    }

    public class NativeDownloadsBridge {
        @JavascriptInterface
        public void saveDataUrl(String requestedName, String dataUrl) {
            new Thread(() -> {
                try {
                    String name = sanitizeFileName(requestedName);
                    int comma = dataUrl == null ? -1 : dataUrl.indexOf(',');
                    if (comma < 0) throw new IllegalArgumentException("Contenido inválido");
                    String header = dataUrl.substring(0, comma);
                    String mime = "application/octet-stream";
                    if (header.startsWith("data:")) {
                        int semicolon = header.indexOf(';');
                        if (semicolon > 5) mime = header.substring(5, semicolon);
                    }
                    byte[] bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT);
                    saveBytes(name, mime, bytes);
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Archivo guardado en Descargas", Toast.LENGTH_LONG).show());
                } catch (Exception error) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "No se pudo guardar el archivo", Toast.LENGTH_LONG).show());
                }
            }).start();
        }

        @JavascriptInterface
        public void showError() {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, "No se pudo preparar la descarga", Toast.LENGTH_SHORT).show());
        }

        private String sanitizeFileName(String value) {
            String clean = String.valueOf(value == null ? "archivo" : value)
                    .replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_").trim();
            return clean.isEmpty() ? "archivo" : clean;
        }

        private void saveBytes(String name, String mime, byte[] bytes) throws Exception {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ProfeQr");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("No se pudo crear la descarga");
                try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                    if (output == null) throw new IllegalStateException("No se pudo abrir la descarga");
                    output.write(bytes);
                } catch (Exception error) {
                    getContentResolver().delete(uri, null, null);
                    throw error;
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(uri, values, null, null);
                return;
            }
            File directory = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "ProfeQr");
            if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("No se pudo crear la carpeta");
            try (OutputStream output = new FileOutputStream(new File(directory, name))) {
                output.write(bytes);
            }
        }
    }

    public class NativeSpeechBridge implements RecognitionListener {
        private SpeechRecognizer recognizer;

        @JavascriptInterface
        public void start() {
            runOnUiThread(() -> {
                if (!SpeechRecognizer.isRecognitionAvailable(MainActivity.this)) {
                    dispatchError("service-not-allowed");
                    dispatchEnd();
                    return;
                }
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, SPEECH_PERMISSION_REQUEST);
                    return;
                }
                startListeningNow();
            });
        }

        private void startListeningNow() {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(MainActivity.this);
                recognizer.setRecognitionListener(this);
            }
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-MX");
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            recognizer.startListening(intent);
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> {
                if (recognizer != null) recognizer.stopListening();
                dispatchEnd();
            });
        }

        private void dispatchResult(String text, boolean isFinal) {
            if (text == null || text.trim().isEmpty()) return;
            evaluate("window.__profeqrSpeechResult(" + JSONObject.quote(text.trim()) + "," + isFinal + ");");
        }

        private void dispatchError(String code) {
            evaluate("window.__profeqrSpeechError(" + JSONObject.quote(code) + ");");
        }

        private void dispatchEnd() {
            evaluate("window.__profeqrSpeechEnd();");
        }

        private void evaluate(String javascript) {
            if (webView != null) webView.post(() -> webView.evaluateJavascript(javascript, null));
        }

        private String firstResult(Bundle results) {
            if (results == null) return "";
            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            return matches == null || matches.isEmpty() ? "" : matches.get(0);
        }

        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}

        @Override
        public void onError(int error) {
            String code = error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT
                    ? "no-speech" : error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS
                    ? "not-allowed" : error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT
                    ? "network" : "audio-capture";
            dispatchError(code);
            dispatchEnd();
        }

        @Override
        public void onResults(Bundle results) {
            dispatchResult(firstResult(results), true);
            dispatchEnd();
        }

        @Override
        public void onPartialResults(Bundle partialResults) {
            dispatchResult(firstResult(partialResults), false);
        }

        @Override public void onEvent(int eventType, Bundle params) {}

        private void destroy() {
            if (recognizer != null) {
                recognizer.cancel();
                recognizer.destroy();
                recognizer = null;
            }
        }
    }
}
