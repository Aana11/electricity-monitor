package com.electricitymonitor.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Assignment
import androidx.compose.material.icons.rounded.BarChart
import androidx.compose.material.icons.rounded.HowToVote
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Notifications

enum class MainTab(val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Home("首页", Icons.Rounded.Home),
    Dashboard("电费", Icons.Rounded.BarChart),
    Votes("投票", Icons.Rounded.HowToVote),
    Affairs("事务", Icons.Rounded.Assignment)
}

@Composable
fun AppRoot() {
    var selected by remember { mutableStateOf(MainTab.Home) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                MainTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = selected == tab,
                        onClick = { selected = tab },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color(0xFFF0F7FF), Color.White)
                    )
                )
        ) {
            when (selected) {
                MainTab.Home -> HomeScreen()
                MainTab.Dashboard -> DashboardScreen()
                MainTab.Votes -> VotesScreen()
                MainTab.Affairs -> AffairsScreen()
            }
        }
    }
}

@Composable
private fun HomeScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("宿舍三两事", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text("和网站保持一致的清新卡片风格", color = Color(0xFF64748B))
        }
        item {
            ElectricityHeroCard()
        }
        item {
            QuickActionsCard()
        }
        item {
            AlertCard()
        }
    }
}

@Composable
private fun ElectricityHeroCard() {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E3A8A)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text("当前电费余额", color = Color.White.copy(alpha = 0.85f))
            Text("¥ 65.30", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("较昨日 -¥ 4.20", color = Color(0xFFBBF7D0))
        }
    }
}

@Composable
private fun QuickActionsCard() {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("快捷入口", fontWeight = FontWeight.SemiBold)
            Text("• 电费趋势分析")
            Text("• 宿舍投票")
            Text("• 今日待办事务")
        }
    }
}

@Composable
private fun AlertCard() {
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF7ED))) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(Icons.Rounded.Notifications, contentDescription = "alert", tint = Color(0xFFF97316))
            Spacer(modifier = Modifier.height(6.dp))
            Text("低电费提醒", fontWeight = FontWeight.Bold)
            Text("当余额低于 20 元时自动推送通知。", color = Color(0xFF7C2D12))
        }
    }
}

@Composable
private fun DashboardScreen() {
    CenterTitle("电费监控", "保留网站中的核心统计信息布局")
}

@Composable
private fun VotesScreen() {
    CenterTitle("投票分工", "采用卡片列表展示进行中的投票")
}

@Composable
private fun AffairsScreen() {
    CenterTitle("宿舍事务", "支持优先级与截止时间的待办事项")
}

@Composable
private fun CenterTitle(title: String, desc: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(desc, color = Color(0xFF64748B))
        }
    }
}
