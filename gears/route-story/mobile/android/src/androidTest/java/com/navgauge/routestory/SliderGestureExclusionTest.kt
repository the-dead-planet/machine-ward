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
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@SdkSuppress(minSdkVersion = 29)
public class SliderGestureExclusionTest {
    @Test
    public fun tracksVisibleBoundsAndRestoresExclusions() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val dialog = Dialog(activity)
                val content = FrameLayout(activity)
                val slider = View(activity)
                slider.setTag(R.id.view_tag_native_id, "route-story-player-slider")
                content.addView(slider, FrameLayout.LayoutParams(200, 80, Gravity.BOTTOM))
                dialog.setContentView(content)
                dialog.show()
                dialog.window!!.setLayout(400, 600)
                val root = dialog.window!!.decorView
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
                    val visible = Rect()
                    val offset = IntArray(2)
                    slider.getGlobalVisibleRect(visible)
                    root.getLocationOnScreen(offset)
                    return Rect(0, visible.top - offset[1], root.width, visible.bottom - offset[1])
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
                    dialog.dismiss()
                }
            }
        }
    }
}
