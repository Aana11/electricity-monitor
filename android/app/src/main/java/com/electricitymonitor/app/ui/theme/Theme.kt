package com.electricitymonitor.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = PrimaryBlue,
    secondary = AccentGreen,
    background = SoftBackground
)

private val DarkColors = darkColorScheme(
    primary = PrimaryBlue,
    secondary = AccentGreen
)

@Composable
fun DormitoryElectricityTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = Typography,
        content = content
    )
}
