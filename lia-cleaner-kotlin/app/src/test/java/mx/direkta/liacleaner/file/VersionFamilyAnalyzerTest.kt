package mx.direkta.liacleaner.file

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class VersionFamilyAnalyzerTest {

    private fun item(name: String, modified: Long = 1L): CleanerFileItem {
        return CleanerFileItem(
            file = File("/storage/emulated/0/Download/$name"),
            name = name,
            sizeBytes = 100L,
            modifiedMs = modified,
            addedMs = null,
            relativePath = "Download/",
            kind = when (name.substringAfterLast('.').lowercase()) {
                "apk" -> CleanerFileKind.APK
                "zip" -> CleanerFileKind.ARCHIVE
                else -> CleanerFileKind.DOCUMENT
            },
            isDownload = true
        )
    }

    @Test
    fun groupsSemanticVersionsAndKeepsNewestFirst() {
        val families = VersionFamilyAnalyzer.findFamilies(
            listOf(item("LIA-Cleaner-v11.apk"), item("LIA-Cleaner-v13.apk"), item("LIA-Cleaner-v12.apk"))
        )
        assertEquals(1, families.size)
        assertEquals("LIA-Cleaner-v13.apk", families.first().latest.name)
        assertEquals(2, families.first().removableKeeping(1).size)
    }

    @Test
    fun groupsNumberedCopies() {
        val families = VersionFamilyAnalyzer.findFamilies(
            listOf(item("reporte (1).pdf", 1), item("reporte (2).pdf", 2), item("reporte (3).pdf", 3))
        )
        assertEquals(1, families.size)
        assertEquals("reporte (3).pdf", families.first().latest.name)
    }

    @Test
    fun doesNotGroupUnrelatedFilesWithoutVersionSignals() {
        val families = VersionFamilyAnalyzer.findFamilies(
            listOf(item("reporte enero.pdf"), item("reporte febrero.pdf"), item("reporte marzo.pdf"))
        )
        assertTrue(families.isEmpty())
    }
}
