package com.electricitymonitor.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.electricitymonitor.app.ui.AppRoot
import com.electricitymonitor.app.ui.theme.DormitoryElectricityTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DormitoryElectricityTheme {
                AppRoot()
            }
        }
    }
}
