package mx.direkta.liacleaner.photo

import android.content.Context
import android.net.Uri
import mx.direkta.liacleaner.model.PhotoGroup
import mx.direkta.liacleaner.model.PhotoGroupKind
import mx.direkta.liacleaner.model.PhotoItem
import mx.direkta.liacleaner.model.PhotoScanResult
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class CachedPhotoScan(
    val quick: PhotoScanResult?,
    val aiGroups: List<PhotoGroup>
)

object PhotoScanCache {
    private const val VERSION = 1
    private const val FILE_NAME = "lia_photo_scan_v1.json"

    fun saveQuick(context: Context, result: PhotoScanResult) {
        write(context, result, emptyList())
    }

    fun saveAi(context: Context, groups: List<PhotoGroup>) {
        val current = load(context)
        write(context, current.quick ?: return, groups)
    }

    fun load(context: Context): CachedPhotoScan = runCatching {
        val file = File(context.filesDir, FILE_NAME)
        if (!file.exists()) return CachedPhotoScan(null, emptyList())
        val root = JSONObject(file.readText())
        if (root.optInt("version") != VERSION) return CachedPhotoScan(null, emptyList())

        val photosArray = root.optJSONArray("photos") ?: JSONArray()
        val photos = mutableListOf<PhotoItem>()
        val byId = mutableMapOf<Long, PhotoItem>()
        for (i in 0 until photosArray.length()) {
            val item = photoFromJson(photosArray.getJSONObject(i))
            photos += item
            byId[item.id] = item
        }
        val exact = groupsFromJson(root.optJSONArray("exact") ?: JSONArray(), byId)
        val near = groupsFromJson(root.optJSONArray("near") ?: JSONArray(), byId)
        val ai = groupsFromJson(root.optJSONArray("ai") ?: JSONArray(), byId)
        val quick = if (photos.isEmpty()) null else PhotoScanResult(
            photos = photos,
            exactGroups = exact,
            nearGroups = near,
            analyzedAtMs = root.optLong("analyzedAt", System.currentTimeMillis())
        )
        CachedPhotoScan(quick, ai)
    }.getOrElse { CachedPhotoScan(null, emptyList()) }

    fun clear(context: Context) {
        runCatching { File(context.filesDir, FILE_NAME).delete() }
    }

    private fun write(context: Context, quick: PhotoScanResult, ai: List<PhotoGroup>) {
        val root = JSONObject().apply {
            put("version", VERSION)
            put("analyzedAt", quick.analyzedAtMs)
            put("photos", JSONArray().apply { quick.photos.forEach { put(photoToJson(it)) } })
            put("exact", groupsToJson(quick.exactGroups))
            put("near", groupsToJson(quick.nearGroups))
            put("ai", groupsToJson(ai))
        }
        val target = File(context.filesDir, FILE_NAME)
        val temp = File(context.filesDir, "$FILE_NAME.tmp")
        temp.writeText(root.toString())
        if (target.exists()) target.delete()
        temp.renameTo(target)
    }

    private fun photoToJson(photo: PhotoItem) = JSONObject().apply {
        put("id", photo.id)
        put("uri", photo.uri.toString())
        put("name", photo.name)
        put("size", photo.sizeBytes)
        put("width", photo.width)
        put("height", photo.height)
        put("taken", photo.dateTakenMs)
        put("modified", photo.dateModifiedMs)
        putNullable("sha", photo.sha256)
        putNullable("dhash", photo.dHash)
        putNullable("phash", photo.pHash)
    }

    private fun photoFromJson(obj: JSONObject) = PhotoItem(
        id = obj.getLong("id"),
        uri = Uri.parse(obj.getString("uri")),
        name = obj.optString("name"),
        sizeBytes = obj.optLong("size"),
        width = obj.optInt("width"),
        height = obj.optInt("height"),
        dateTakenMs = obj.optLong("taken"),
        dateModifiedMs = obj.optLong("modified"),
        sha256 = if (obj.isNull("sha")) null else obj.optString("sha"),
        dHash = if (obj.isNull("dhash")) null else obj.optLong("dhash"),
        pHash = if (obj.isNull("phash")) null else obj.optLong("phash")
    )

    private fun groupsToJson(groups: List<PhotoGroup>) = JSONArray().apply {
        groups.forEach { group ->
            put(JSONObject().apply {
                put("id", group.id)
                put("kind", group.kind.name)
                if (group.similarity != null) put("similarity", group.similarity) else put("similarity", JSONObject.NULL)
                put("ids", JSONArray(group.photos.map { it.id }))
            })
        }
    }

    private fun groupsFromJson(array: JSONArray, byId: Map<Long, PhotoItem>): List<PhotoGroup> {
        val output = mutableListOf<PhotoGroup>()
        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            val ids = obj.optJSONArray("ids") ?: continue
            val photos = mutableListOf<PhotoItem>()
            for (j in 0 until ids.length()) byId[ids.getLong(j)]?.let(photos::add)
            if (photos.size < 2) continue
            output += PhotoGroup(
                id = obj.optString("id"),
                kind = runCatching { PhotoGroupKind.valueOf(obj.optString("kind")) }.getOrDefault(PhotoGroupKind.NEAR_DUPLICATE),
                photos = photos,
                similarity = if (obj.isNull("similarity")) null else obj.optDouble("similarity")
            )
        }
        return output
    }

    private fun JSONObject.putNullable(key: String, value: Any?) {
        if (value == null) put(key, JSONObject.NULL) else put(key, value)
    }
}
