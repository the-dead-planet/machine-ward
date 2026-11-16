package com.navgauge.routestory

import android.graphics.Point
import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import androidx.annotation.RequiresApi
import com.facebook.react.uimanager.util.ReactFindViewUtil
import java.lang.ref.WeakReference

@RequiresApi(Build.VERSION_CODES.Q)
internal class SliderGestureExclusion(private val root: View) {
    private val nativeId = "route-story-player-slider"
    private val originalRects = root.systemGestureExclusionRects.map { Rect(it) }
    private val visibleBounds = Rect()
    private val rootBounds = Rect()
    private val rootOffset = Point()
    private var slider: WeakReference<View>? = null
    private val viewListener = ReactFindViewUtil.OnMultipleViewsFoundListener { view, _ ->
        slider = WeakReference(view)
    }
    private val drawListener = ViewTreeObserver.OnPreDrawListener {
        update()
        true
    }

    public fun attach() {
        ReactFindViewUtil.addViewsListener(viewListener, setOf(nativeId))
        slider = ReactFindViewUtil.findView(root, nativeId)?.let { WeakReference(it) }
        root.viewTreeObserver.addOnPreDrawListener(drawListener)
    }

    private fun update() {
        val control = slider?.get()
        val bounds = if (
            control != null && control.isAttachedToWindow && control.isShown &&
            control.rootView === root && control.getGlobalVisibleRect(visibleBounds) &&
            root.getGlobalVisibleRect(rootBounds, rootOffset)
        ) {
            // Reserve only the controls' visible vertical band at both screen edges.
            Rect(
                0,
                (visibleBounds.top - rootOffset.y).coerceIn(0, root.height),
                root.width,
                (visibleBounds.bottom - rootOffset.y).coerceIn(0, root.height),
            ).takeUnless { it.isEmpty }
        } else {
            null
        }
        val rectangles = if (bounds == null) originalRects else originalRects + bounds
        if (root.systemGestureExclusionRects != rectangles) {
            root.systemGestureExclusionRects = rectangles
        }
    }

    public fun detach() {
        ReactFindViewUtil.removeViewsListener(viewListener)
        if (root.viewTreeObserver.isAlive) {
            root.viewTreeObserver.removeOnPreDrawListener(drawListener)
        }
        root.systemGestureExclusionRects = originalRects
        slider = null
    }
}
