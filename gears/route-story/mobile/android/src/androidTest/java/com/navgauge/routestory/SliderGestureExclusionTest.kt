package com.navgauge.routestory

import android.app.Dialog
import android.graphics.Rect
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.SdkSuppress
import com.app.MainActivity
import com.facebook.react.R
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@SdkSuppress(minSdkVersion = 29)
public class SliderGestureExclusionTest {
    @Test
    public fun tracksVisibleBoundsAndRestoresExclusions() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            val sliderAttached = CountDownLatch(1)
            lateinit var content: FrameLayout
            lateinit var slider: View
            var dialog: Dialog? = null
            try {
                scenario.onActivity { activity ->
                    content = FrameLayout(activity)
                    slider = View(activity)
                    slider.setTag(R.id.view_tag_native_id, "route-story-player-slider")
                    slider.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
                        override fun onViewAttachedToWindow(view: View) {
                            view.removeOnAttachStateChangeListener(this)
                            sliderAttached.countDown()
                        }

                        override fun onViewDetachedFromWindow(view: View) {}
                    })
                    content.addView(slider, FrameLayout.LayoutParams(200, 80, Gravity.BOTTOM))
                    val sliderDialog = Dialog(activity)
                    dialog = sliderDialog
                    sliderDialog.setContentView(content)
                    sliderDialog.show()
                    sliderDialog.window!!.setLayout(400, 600)
                }
                // Window attachment needs a real traversal after the UI-thread setup returns.
                assertTrue("Slider did not attach to the dialog window", sliderAttached.await(10, TimeUnit.SECONDS))
                scenario.onActivity {
                    val root = checkNotNull(dialog).window!!.decorView as ViewGroup
                    assertTrue(slider.isAttachedToWindow)
                    val original = listOf(Rect(0, 10, 20, 30))
                    root.systemGestureExclusionRects = original
                    val exclusion = SliderGestureExclusion(root)
                    exclusion.attach()
                    fun draw() {
                        root.measure(
                            View.MeasureSpec.makeMeasureSpec(400, View.MeasureSpec.EXACTLY),
                            View.MeasureSpec.makeMeasureSpec(600, View.MeasureSpec.EXACTLY),
                        )
                        root.layout(0, 0, 400, 600)
                        root.viewTreeObserver.dispatchOnPreDraw()
                    }
                    fun expectedBand(): Rect {
                        assertTrue(slider.getGlobalVisibleRect(Rect()))
                        val bounds = Rect()
                        slider.getDrawingRect(bounds)
                        root.offsetDescendantRectToMyCoords(slider, bounds)
                        return Rect(0, bounds.top, root.width, bounds.bottom)
                    }
                    try {
                        draw()
                        assertEquals(original + expectedBand(), root.systemGestureExclusionRects)
                        val previousBand = expectedBand()
                        slider.layoutParams = (slider.layoutParams as FrameLayout.LayoutParams).apply {
                            height = 40
                            bottomMargin = 30
                        }
                        root.requestLayout()
                        draw()
                        assertEquals(false, previousBand == expectedBand())
                        assertEquals(original + expectedBand(), root.systemGestureExclusionRects)
                        slider.visibility = View.GONE
                        draw()
                        assertEquals(original, root.systemGestureExclusionRects)
                        slider.visibility = View.VISIBLE
                        draw()
                        assertEquals(original + expectedBand(), root.systemGestureExclusionRects)
                        (slider.parent as ViewGroup).removeView(slider)
                        draw()
                        assertEquals(original, root.systemGestureExclusionRects)
                        content.addView(slider)
                        draw()
                        assertEquals(original + expectedBand(), root.systemGestureExclusionRects)
                        exclusion.detach()
                        assertEquals(original, root.systemGestureExclusionRects)
                        draw()
                        assertEquals(original, root.systemGestureExclusionRects)
                    } finally {
                        exclusion.detach()
                    }
                }
            } finally {
                scenario.onActivity { dialog?.dismiss() }
            }
        }
    }
}
