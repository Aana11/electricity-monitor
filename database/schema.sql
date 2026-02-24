-- 南宁师范大学电费监控系统数据库
-- 数据库: electricity_monitor

-- 创建数据库
CREATE DATABASE IF NOT EXISTS electricity_monitor 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE electricity_monitor;

-- ==================== 用户表 ====================
-- 存储系统用户信息（与学校账号绑定）
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_account VARCHAR(32) NOT NULL COMMENT '学校系统账号（手机号）',
    school_password VARCHAR(255) NOT NULL COMMENT '学校系统密码（加密存储）',
    real_name VARCHAR(50) COMMENT '真实姓名',
    gender TINYINT DEFAULT 0 COMMENT '性别: 0未知, 1男, 2女',
    mobile VARCHAR(20) COMMENT '手机号',
    room_id VARCHAR(50) COMMENT '房间ID',
    room_name VARCHAR(200) COMMENT '房间名称（如：武鸣校区桂园公寓13-513）',
    device_no VARCHAR(50) COMMENT '电表编号',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用: 0禁用, 1启用',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_school_account (school_account),
    INDEX idx_room (room_id),
    INDEX idx_device (device_no)
) ENGINE=InnoDB COMMENT='用户表';

-- ==================== 电费数据表 ====================
-- 存储每次采集的电费数据
CREATE TABLE electricity_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    device_no VARCHAR(50) NOT NULL COMMENT '电表编号',
    balance DECIMAL(10,2) NOT NULL COMMENT '余额（元）',
    price DECIMAL(10,4) NOT NULL COMMENT '电价（元/度）',
    remaining_kwh DECIMAL(10,2) NOT NULL COMMENT '剩余电量（度）',
    meter_reading_time TIMESTAMP NULL COMMENT '电表抄表时间',
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '数据采集时间',
    
    INDEX idx_user_time (user_id, collected_at),
    INDEX idx_device_time (device_no, collected_at),
    INDEX idx_collected (collected_at)
) ENGINE=InnoDB COMMENT='电费数据记录表';

-- ==================== 用电统计表 ====================
-- 按日统计用电情况
CREATE TABLE daily_usage (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    device_no VARCHAR(50) NOT NULL COMMENT '电表编号',
    date DATE NOT NULL COMMENT '日期',
    start_balance DECIMAL(10,2) COMMENT '当日开始余额',
    end_balance DECIMAL(10,2) COMMENT '当日结束余额',
    used_kwh DECIMAL(10,2) DEFAULT 0 COMMENT '当日用电量（度）',
    used_amount DECIMAL(10,2) DEFAULT 0 COMMENT '当日用电金额（元）',
    peak_kwh DECIMAL(10,2) DEFAULT 0 COMMENT '高峰时段用电量',
    valley_kwh DECIMAL(10,2) DEFAULT 0 COMMENT '低谷时段用电量',
    record_count INT DEFAULT 0 COMMENT '当日记录数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_date (user_id, device_no, date),
    INDEX idx_date (date)
) ENGINE=InnoDB COMMENT='每日用电统计表';

-- ==================== 充值记录表 ====================
-- 存储充值记录（从系统中抓取或手动录入）
CREATE TABLE recharge_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    device_no VARCHAR(50) NOT NULL COMMENT '电表编号',
    amount DECIMAL(10,2) NOT NULL COMMENT '充值金额（元）',
    before_balance DECIMAL(10,2) COMMENT '充值前余额',
    after_balance DECIMAL(10,2) COMMENT '充值后余额',
    recharge_type TINYINT DEFAULT 1 COMMENT '充值类型: 1线上, 2线下',
    recharge_time TIMESTAMP NULL COMMENT '充值时间',
    order_no VARCHAR(100) COMMENT '订单号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_time (recharge_time)
) ENGINE=InnoDB COMMENT='充值记录表';

-- ==================== 预测记录表 ====================
-- 存储电费耗尽预测
CREATE TABLE predictions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    device_no VARCHAR(50) NOT NULL COMMENT '电表编号',
    current_balance DECIMAL(10,2) NOT NULL COMMENT '当前余额',
    avg_daily_usage DECIMAL(10,4) COMMENT '日均用电量（度）',
    avg_daily_cost DECIMAL(10,4) COMMENT '日均用电金额（元）',
    predicted_empty_date DATE COMMENT '预计耗尽日期',
    predicted_days_left INT COMMENT '预计剩余天数',
    confidence_level DECIMAL(3,2) DEFAULT 0.8 COMMENT '预测置信度',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_calculated (calculated_at)
) ENGINE=InnoDB COMMENT='电费预测表';

-- ==================== 采集日志表 ====================
-- 记录定时任务的执行情况
CREATE TABLE collection_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    status TINYINT NOT NULL COMMENT '状态: 1成功, 2失败, 3部分成功',
    total_users INT DEFAULT 0 COMMENT '总用户数',
    success_count INT DEFAULT 0 COMMENT '成功数',
    fail_count INT DEFAULT 0 COMMENT '失败数',
    error_message TEXT COMMENT '错误信息',
    started_at TIMESTAMP NULL COMMENT '开始时间',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='采集日志表';

-- ==================== 排行榜快照表 ====================
-- 存储排行榜数据（每日/每周/每月）
CREATE TABLE ranking_snapshots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rank_type VARCHAR(20) NOT NULL COMMENT '排行榜类型: daily, weekly, monthly',
    period_start DATE NOT NULL COMMENT '周期开始日期',
    period_end DATE NOT NULL COMMENT '周期结束日期',
    rankings JSON NOT NULL COMMENT '排行榜数据 JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_type_period (rank_type, period_start),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='排行榜快照表';

-- 插入测试数据（开发用）
INSERT INTO users (school_account, school_password, real_name, gender, mobile, room_id, room_name, device_no, is_active) VALUES
('19940686925', '#ZYFzyf20051029', '周逸飞', 1, '19940686925', '878680437252165632', '武鸣校区桂园公寓13栋5楼学生宿舍桂园公寓13-513', '003101003732', 1);
