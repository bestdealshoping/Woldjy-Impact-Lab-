package com.woldjyimpactlab.app

import android.app.Activity
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.*
import android.widget.*
import android.content.Intent
import android.graphics.Color

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var progress: ProgressBar
    private lateinit var errorBox: LinearLayout
    private val home = "https://bestdealshoping.github.io/Woldjy-Impact-Lab-/"
    private val logo = "https://raw.githubusercontent.com/bestdealshoping/Woldjy-Impact-Lab-/main/wil-logo-small-1.jpg"

    @Suppress("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(5, 8, 18)
        window.navigationBarColor = Color.BLACK

        val root = FrameLayout(this)
        webView = WebView(this)
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        errorBox = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(32, 32, 32, 32)
            visibility = View.GONE
            addView(TextView(this@MainActivity).apply {
                text = "Connexion impossible. Vérifiez Internet puis réessayez."
                textSize = 17f
                setTextColor(Color.WHITE)
                gravity = android.view.Gravity.CENTER
            })
            addView(Button(this@MainActivity).apply {
                text = "Réessayer"
                setOnClickListener { visibility = View.GONE; webView.loadUrl(home) }
            })
        }

        root.addView(webView, FrameLayout.LayoutParams(-1, -1))
        root.addView(progress, FrameLayout.LayoutParams(-1, 8, android.view.Gravity.TOP))
        root.addView(errorBox, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.loadsImagesAutomatically = true
        webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                val scheme = uri.scheme ?: ""
                if (scheme == "http" || scheme == "https") return false
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, uri)); true
                } catch (_: Exception) { true }
            }
            override fun onPageFinished(view: WebView, url: String) {
                progress.visibility = View.GONE
                errorBox.visibility = View.GONE
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) {
                    progress.visibility = View.GONE
                    errorBox.visibility = View.VISIBLE
                }
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
                progress.visibility = if (newProgress < 100) View.VISIBLE else View.GONE
            }
        }

        if (savedInstanceState == null) {
            val splash = """
                <!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#050812}
                body{display:flex;align-items:center;justify-content:center}
                img{width:82%;max-width:360px;height:auto;object-fit:contain}
                </style></head><body><img src="$logo" alt="Woldjy Impact Lab"></body></html>
            """.trimIndent()
            webView.loadDataWithBaseURL("https://raw.githubusercontent.com/", splash, "text/html", "UTF-8", null)
            Handler(Looper.getMainLooper()).postDelayed({ webView.loadUrl(home) }, 1800)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    @Deprecated("Deprecated in Android")
    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }
}
