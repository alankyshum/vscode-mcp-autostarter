"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
class PerformanceMonitor {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
        this.startTime = Date.now();
        this.metrics = {
            extensionStartTime: this.startTime,
            serverStartTimes: new Map(),
            commandExecutionTimes: new Map(),
            memoryUsage: process.memoryUsage(),
            lastHealthCheck: 0
        };
    }
    /**
     * Record server start time
     */
    recordServerStart(serverId) {
        this.metrics.serverStartTimes.set(serverId, Date.now());
        this.outputChannel.appendLine(`[PERF] Server ${serverId} start recorded`);
    }
    /**
     * Record command execution time
     */
    recordCommandExecution(command, executionTime) {
        if (!this.metrics.commandExecutionTimes.has(command)) {
            this.metrics.commandExecutionTimes.set(command, []);
        }
        const times = this.metrics.commandExecutionTimes.get(command);
        times.push(executionTime);
        // Keep only last 10 executions to prevent memory bloat
        if (times.length > 10) {
            times.shift();
        }
        this.outputChannel.appendLine(`[PERF] Command ${command} executed in ${executionTime}ms`);
    }
    /**
     * Update memory usage
     */
    updateMemoryUsage() {
        this.metrics.memoryUsage = process.memoryUsage();
        this.metrics.lastHealthCheck = Date.now();
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const uptime = Date.now() - this.metrics.extensionStartTime;
        const memoryMB = Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024);
        let summary = [
            '=== MCP Auto-Starter Performance Summary ===',
            `Extension Uptime: ${this.formatDuration(uptime)}`,
            `Memory Usage: ${memoryMB} MB`,
            `Active Servers: ${this.metrics.serverStartTimes.size}`,
            ''
        ];
        // Server start times
        if (this.metrics.serverStartTimes.size > 0) {
            summary.push('Server Start Times:');
            for (const [serverId, startTime] of this.metrics.serverStartTimes) {
                const serverUptime = Date.now() - startTime;
                summary.push(`  ${serverId}: ${this.formatDuration(serverUptime)}`);
            }
            summary.push('');
        }
        // Command execution statistics
        if (this.metrics.commandExecutionTimes.size > 0) {
            summary.push('Command Execution Statistics:');
            for (const [command, times] of this.metrics.commandExecutionTimes) {
                const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                const maxTime = Math.max(...times);
                const minTime = Math.min(...times);
                summary.push(`  ${command}:`);
                summary.push(`    Executions: ${times.length}`);
                summary.push(`    Avg: ${avgTime.toFixed(1)}ms`);
                summary.push(`    Min: ${minTime}ms, Max: ${maxTime}ms`);
            }
            summary.push('');
        }
        // Memory details
        summary.push('Memory Details:');
        summary.push(`  Heap Used: ${Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024)} MB`);
        summary.push(`  Heap Total: ${Math.round(this.metrics.memoryUsage.heapTotal / 1024 / 1024)} MB`);
        summary.push(`  External: ${Math.round(this.metrics.memoryUsage.external / 1024 / 1024)} MB`);
        summary.push(`  RSS: ${Math.round(this.metrics.memoryUsage.rss / 1024 / 1024)} MB`);
        return summary.join('\n');
    }
    /**
     * Check for performance issues
     */
    checkPerformanceIssues() {
        const issues = [];
        // Check memory usage
        const memoryMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024;
        if (memoryMB > 100) {
            issues.push(`High memory usage: ${Math.round(memoryMB)} MB`);
        }
        // Check slow commands
        for (const [command, times] of this.metrics.commandExecutionTimes) {
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            if (avgTime > 1000) {
                issues.push(`Slow command execution: ${command} (avg: ${avgTime.toFixed(1)}ms)`);
            }
        }
        // Check if too many servers are running
        if (this.metrics.serverStartTimes.size > 10) {
            issues.push(`Many servers running: ${this.metrics.serverStartTimes.size}`);
        }
        return issues;
    }
    /**
     * Log performance metrics
     */
    logMetrics() {
        this.updateMemoryUsage();
        const summary = this.getPerformanceSummary();
        this.outputChannel.appendLine(`[PERF] ${summary}`);
        const issues = this.checkPerformanceIssues();
        if (issues.length > 0) {
            this.outputChannel.appendLine('[PERF] Performance Issues Detected:');
            issues.forEach(issue => this.outputChannel.appendLine(`[PERF]   - ${issue}`));
        }
    }
    /**
     * Format duration in human-readable format
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
    /**
     * Create a command execution timer
     */
    createCommandTimer(command) {
        const startTime = Date.now();
        return () => {
            const executionTime = Date.now() - startTime;
            this.recordCommandExecution(command, executionTime);
        };
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Reset metrics
     */
    reset() {
        this.metrics = {
            extensionStartTime: Date.now(),
            serverStartTimes: new Map(),
            commandExecutionTimes: new Map(),
            memoryUsage: process.memoryUsage(),
            lastHealthCheck: 0
        };
        this.outputChannel.appendLine('[PERF] Performance metrics reset');
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
//# sourceMappingURL=performanceMonitor.js.map