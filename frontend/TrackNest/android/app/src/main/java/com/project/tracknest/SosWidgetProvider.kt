package com.project.tracknest

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews

class SosWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)

    appWidgetIds.forEach { appWidgetId ->
      val views = RemoteViews(context.packageName, R.layout.sos_widget)
      val clickIntent = buildLaunchIntent(context)

      views.setOnClickPendingIntent(R.id.sos_widget_root, clickIntent)
      views.setOnClickPendingIntent(R.id.sos_widget_button, clickIntent)

      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }

  override fun onEnabled(context: Context) {
    super.onEnabled(context)
  }

  override fun onDisabled(context: Context) {
    super.onDisabled(context)
  }

  private fun buildLaunchIntent(context: Context): PendingIntent {
    val intent = Intent(context, MainActivity::class.java).apply {
      action = Intent.ACTION_VIEW
      data = Uri.parse("tracknest://sos?source=widget")
      flags =
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP
    }

    val flags =
      PendingIntent.FLAG_UPDATE_CURRENT or
        (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)

    return PendingIntent.getActivity(context, 1001, intent, flags)
  }
}
