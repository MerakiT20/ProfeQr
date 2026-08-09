package mx.direkta.liacleaner.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import mx.direkta.liacleaner.system.AndroidSystemGateway
import mx.direkta.liacleaner.system.CleanerPreferences

@Composable
fun LiaCleanerRoot(
    systemGateway: AndroidSystemGateway,
    preferences: CleanerPreferences,
    onPreferencesChanged: () -> Unit
) {
    var settingsOpen by remember { mutableStateOf(false) }
    var confirmSystemApps by remember { mutableStateOf(false) }
    var showSystemApps by remember { mutableStateOf(preferences.showSystemApps) }

    Box(Modifier.fillMaxSize()) {
        LiaCleanerApp(systemGateway)

        if (showSystemApps) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 14.dp, bottom = 148.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.errorContainer,
                tonalElevation = 3.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    Icon(
                        Icons.Default.WarningAmber,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Text(
                        "Apps del sistema visibles",
                        fontSize = MaterialTheme.typography.labelMedium.fontSize,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
        }

        FloatingActionButton(
            onClick = { settingsOpen = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 14.dp, bottom = 88.dp),
            containerColor = if (showSystemApps) {
                MaterialTheme.colorScheme.errorContainer
            } else {
                MaterialTheme.colorScheme.secondaryContainer
            },
            contentColor = if (showSystemApps) {
                MaterialTheme.colorScheme.onErrorContainer
            } else {
                MaterialTheme.colorScheme.onSecondaryContainer
            }
        ) {
            Icon(Icons.Default.Settings, contentDescription = "Configuración")
        }
    }

    if (settingsOpen) {
        AlertDialog(
            onDismissRequest = { settingsOpen = false },
            title = { Text("Configuración") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("Mostrar apps del sistema", fontWeight = FontWeight.SemiBold)
                            Text(
                                "Desactivado por seguridad. Úsalo solo para diagnóstico.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(Modifier.size(10.dp))
                        Switch(
                            checked = showSystemApps,
                            onCheckedChange = { enabled ->
                                if (enabled) {
                                    settingsOpen = false
                                    confirmSystemApps = true
                                } else {
                                    showSystemApps = false
                                    preferences.showSystemApps = false
                                    settingsOpen = false
                                    onPreferencesChanged()
                                }
                            }
                        )
                    }

                    if (showSystemApps) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.55f))
                                .padding(12.dp)
                        ) {
                            Text(
                                "Modo de sistema activo",
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Text(
                                "Los componentes del sistema se muestran como protegidos y no cuentan como espacio liberable.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { settingsOpen = false }) {
                    Text("Cerrar")
                }
            }
        )
    }

    if (confirmSystemApps) {
        AlertDialog(
            onDismissRequest = {
                confirmSystemApps = false
                settingsOpen = true
            },
            icon = { Icon(Icons.Default.WarningAmber, contentDescription = null) },
            title = { Text("¿Mostrar apps del sistema?") },
            text = {
                Text(
                    "Algunos componentes son esenciales para seguridad, llamadas, permisos, actualizaciones o el funcionamiento de Android. LIA Cleaner los mostrará solo para diagnóstico y no los recomendará para eliminar."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showSystemApps = true
                        preferences.showSystemApps = true
                        confirmSystemApps = false
                        onPreferencesChanged()
                    }
                ) {
                    Text("Mostrar de todos modos")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        confirmSystemApps = false
                        settingsOpen = true
                    }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}
