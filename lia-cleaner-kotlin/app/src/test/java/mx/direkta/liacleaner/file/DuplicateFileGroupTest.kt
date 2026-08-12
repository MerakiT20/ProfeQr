package mx.direkta.liacleaner.file

import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File

class DuplicateFileGroupTest {
    @Test
    fun keepsMostRecentFileAndCountsOtherCopiesAsRecoverable() {
        val old = CleanerFileItem(File("/tmp/a.bin"), "a.bin", 100, 1000, null, "Download/", CleanerFileKind.OTHER, true)
        val newest = CleanerFileItem(File("/tmp/b.bin"), "b.bin", 100, 3000, null, "Download/", CleanerFileKind.OTHER, true)
        val middle = CleanerFileItem(File("/tmp/c.bin"), "c.bin", 100, 2000, null, "Download/", CleanerFileKind.OTHER, true)
        val group = DuplicateFileGroup("hash", listOf(old, newest, middle))

        assertEquals("b.bin", group.keep.name)
        assertEquals(200, group.recoverableBytes)
    }
}
