package mx.direkta.liacleaner.photo

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

data class CachedPhotoHash(
    val id: Long,
    val sizeBytes: Long,
    val modifiedMs: Long,
    val sha256: String?,
    val dHash: Long?,
    val pHash: Long?
)

class PhotoHashCache(context: Context) : SQLiteOpenHelper(
    context,
    "lia_photo_hashes.db",
    null,
    1
) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE photo_hashes (
                media_id INTEGER PRIMARY KEY,
                size_bytes INTEGER NOT NULL,
                modified_ms INTEGER NOT NULL,
                sha256 TEXT,
                dhash INTEGER,
                phash INTEGER
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    fun get(id: Long, sizeBytes: Long, modifiedMs: Long): CachedPhotoHash? {
        readableDatabase.query(
            "photo_hashes",
            arrayOf("media_id", "size_bytes", "modified_ms", "sha256", "dhash", "phash"),
            "media_id = ? AND size_bytes = ? AND modified_ms = ?",
            arrayOf(id.toString(), sizeBytes.toString(), modifiedMs.toString()),
            null,
            null,
            null
        ).use { cursor ->
            if (!cursor.moveToFirst()) return null
            return CachedPhotoHash(
                id = cursor.getLong(0),
                sizeBytes = cursor.getLong(1),
                modifiedMs = cursor.getLong(2),
                sha256 = cursor.takeUnless { it.isNull(3) }?.getString(3),
                dHash = cursor.takeUnless { it.isNull(4) }?.getLong(4),
                pHash = cursor.takeUnless { it.isNull(5) }?.getLong(5)
            )
        }
    }

    fun put(record: CachedPhotoHash) {
        val values = ContentValues().apply {
            put("media_id", record.id)
            put("size_bytes", record.sizeBytes)
            put("modified_ms", record.modifiedMs)
            if (record.sha256 == null) putNull("sha256") else put("sha256", record.sha256)
            if (record.dHash == null) putNull("dhash") else put("dhash", record.dHash)
            if (record.pHash == null) putNull("phash") else put("phash", record.pHash)
        }
        writableDatabase.insertWithOnConflict(
            "photo_hashes",
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun removeMissing(validIds: Set<Long>) {
        if (validIds.isEmpty()) {
            writableDatabase.delete("photo_hashes", null, null)
            return
        }
        readableDatabase.query(
            "photo_hashes",
            arrayOf("media_id"),
            null,
            null,
            null,
            null,
            null
        ).use { cursor ->
            val stale = mutableListOf<Long>()
            while (cursor.moveToNext()) {
                val id = cursor.getLong(0)
                if (id !in validIds) stale += id
            }
            stale.forEach { id ->
                writableDatabase.delete("photo_hashes", "media_id = ?", arrayOf(id.toString()))
            }
        }
    }
}
