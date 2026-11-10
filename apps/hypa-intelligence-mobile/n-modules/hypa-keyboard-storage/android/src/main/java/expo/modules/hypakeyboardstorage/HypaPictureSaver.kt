package expo.modules.hypakeyboardstorage

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import java.io.File

/** Saves a picture to the gallery's Pictures/Hypa album. Used by the app and the keyboard. */
object HypaPictureSaver {
  fun save(context: Context, file: File, mime: String) {
    val resolver = context.contentResolver
    val values =
      ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, "Hypa_${System.currentTimeMillis()}")
        put(MediaStore.Images.Media.MIME_TYPE, mime)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Hypa")
          put(MediaStore.Images.Media.IS_PENDING, 1)
        }
      }
    val uri =
      resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        ?: throw IllegalStateException("Couldn't save the picture.")
    try {
      resolver.openOutputStream(uri)?.use { out -> file.inputStream().use { it.copyTo(out) } }
        ?: throw IllegalStateException("Couldn't save the picture.")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        resolver.update(uri, ContentValues().apply { put(MediaStore.Images.Media.IS_PENDING, 0) }, null, null)
      }
    } catch (error: Exception) {
      resolver.delete(uri, null, null)
      throw error
    }
  }
}
