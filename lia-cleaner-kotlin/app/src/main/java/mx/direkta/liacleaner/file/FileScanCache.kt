package mx.direkta.liacleaner.file

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object FileScanCache {
    private const val CACHE_VERSION = 1
    private const val FILE_NAME = "lia_file_scan_v1.json"

    fun save(context: Context, result: FileScanResult) {
        val root = JSONObject()
        root.put("version", CACHE_VERSION)
        root.put("savedAt", System.currentTimeMillis())
        val files = JSONArray()
        result.files.forEach { item ->
            files.put(JSONObject().apply {
                put("path", item.file.absolutePath)
                put("name", item.name)
                put("size", item.sizeBytes)
                put("modified", item.modifiedMs)
                if (item.addedMs != null) put("added", item.addedMs) else put("added", JSONObject.NULL)
                put("relative", item.relativePath)
                put("kind", item.kind.name)
                put("download", item.isDownload)
            })
        }
        root.put("files", files)

        val groups = JSONArray()
        result.duplicateGroups.forEach { group ->
            groups.put(JSONObject().apply {
                put("sha", group.sha256)
                put("paths", JSONArray(group.files.map { it.file.absolutePath }))
            })
        }
        root.put("groups", groups)

        val target = File(context.filesDir, FILE_NAME)
        val temp = File(context.filesDir, "$FILE_NAME.tmp")
        temp.writeText(root.toString())
        if (target.exists()) target.delete()
        temp.renameTo(target)
    }

    fun load(context: Context): FileScanResult? = runCatching {
        val target = File(context.filesDir, FILE_NAME)
        if (!target.exists()) return null
        val root = JSONObject(target.readText())
        if (root.optInt("version") != CACHE_VERSION) return null

        val items = mutableListOf<CleanerFileItem>()
        val byPath = mutableMapOf<String, CleanerFileItem>()
        val files = root.getJSONArray("files")
        for (i in 0 until files.length()) {
            val obj = files.getJSONObject(i)
            val file = File(obj.getString("path"))
            if (!file.exists() || !file.isFile || !file.canRead()) continue
            val cachedSize = obj.optLong("size", -1L)
            val cachedModified = obj.optLong("modified", -1L)
            // Discard stale metadata; a changed file should be re-scanned before
            // being used in a duplicate group.
            if (cachedSize != file.length() || cachedModified != file.lastModified()) continue
            val item = CleanerFileItem(
                file = file,
                name = obj.optString("name", file.name),
                sizeBytes = cachedSize.coerceAtLeast(0L),
                modifiedMs = cachedModified.coerceAtLeast(0L),
                addedMs = if (obj.isNull("added")) null else obj.optLong("added").takeIf { it > 0L },
                relativePath = obj.optString("relative", ""),
                kind = runCatching { CleanerFileKind.valueOf(obj.optString("kind")) }.getOrDefault(CleanerFileKind.OTHER),
                isDownload = obj.optBoolean("download", false)
            )
            items += item
            byPath[file.absolutePath] = item
        }

        val groupsOut = mutableListOf<DuplicateFileGroup>()
        val groups = root.optJSONArray("groups") ?: JSONArray()
        for (i in 0 until groups.length()) {
            val obj = groups.getJSONObject(i)
            val paths = obj.optJSONArray("paths") ?: continue
            val members = mutableListOf<CleanerFileItem>()
            for (j in 0 until paths.length()) byPath[paths.getString(j)]?.let(members::add)
            if (members.size > 1) groupsOut += DuplicateFileGroup(obj.optString("sha"), members.sortedByDescending { it.bestDateMs })
        }
        FileScanResult(items.sortedByDescending { it.sizeBytes }, groupsOut.sortedByDescending { it.recoverableBytes })
    }.getOrNull()

    fun clear(context: Context) {
        runCatching { File(context.filesDir, FILE_NAME).delete() }
    }
}
