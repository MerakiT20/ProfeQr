package mx.direkta.liacleaner.system

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SystemComponentHeuristicsTest {
    @Test
    fun `SafetyCore is treated as a system component`() {
        assertTrue(
            SystemComponentHeuristics.looksLikeSystemComponent(
                "com.google.android.safetycore",
                "Android System SafetyCore"
            )
        )
    }

    @Test
    fun `Android key verifier is treated as a system component`() {
        assertTrue(
            SystemComponentHeuristics.looksLikeSystemComponent(
                "com.example.module",
                "Android System Key Verifier"
            )
        )
    }

    @Test
    fun `ordinary user app is not hidden`() {
        assertFalse(
            SystemComponentHeuristics.looksLikeSystemComponent(
                "com.netflix.mediaclient",
                "Netflix"
            )
        )
    }
}
