<template>
  <div id="app">
    <DatabaseManager />
  </div>
</template>

<script>
import DatabaseManager from './components/DatabaseManager.vue'

export default {
  name: 'App',
  components: {
    DatabaseManager
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
  background: #f5f6fa;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f2f6;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c7d2fe;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a5b4fc;
}

/* 通用工具类 */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.5rem; }

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-5 { margin-top: 1.5rem; }

.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.5rem; }

.d-flex { display: flex; }
.align-items-center { align-items: center; }
.justify-content-center { justify-content: center; }
.justify-content-between { justify-content: space-between; }
.flex-1 { flex: 1; }

.hidden { display: none; }
.invisible { visibility: hidden; }

/* 通用按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s ease;
  line-height: 1.5;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-primary {
  background: #4c63d2;
  color: white;
}

.btn-primary:hover {
  background: #3c51c5;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover {
  background: #219a52;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover {
  background: #e67e22;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 2px solid #dee2e6;
}

.btn-outline:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn-ghost {
  background: transparent;
  color: #6c757d;
  border: none;
}

.btn-ghost:hover {
  background: #f8f9fa;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.875rem;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e6ed;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #2c3e50;
  background: white;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #4c63d2;
  box-shadow: 0 0 0 3px rgba(76, 99, 210, 0.1);
}

.form-control:disabled {
  background: #f8f9fa;
  color: #6c757d;
}

.form-control.is-invalid {
  border-color: #e74c3c;
}

.form-control.is-invalid:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.invalid-feedback {
  display: block;
  margin-top: 0.25rem;
  color: #e74c3c;
  font-size: 0.8125rem;
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.8125rem;
}

/* 卡片样式 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e6ed;
  background: #f8f9fa;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e6ed;
  background: #f8f9fa;
}

/* 表格样式 */
.table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e6ed;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

/* 标签样式 */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-primary {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-success {
  background: #e8f5e8;
  color: #2e7d32;
}

.badge-danger {
  background: #ffebee;
  color: #c62828;
}

.badge-warning {
  background: #fff3e0;
  color: #ef6c00;
}

.badge-secondary {
  background: #f5f5f5;
  color: #616161;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  margin: 2rem 0;
}

.pagination .btn {
  min-width: 40px;
  justify-content: center;
}

/* 加载状态 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6c757d;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e6ed;
  border-top: 2px solid #4c63d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.empty-state-description {
  margin-bottom: 1.5rem;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .btn {
    padding: 0.625rem 1rem;
  }
  
  .form-control {
    padding: 0.625rem;
  }
  
  .card-header,
  .card-body,
  .card-footer {
    padding: 1rem;
  }
  
  .table th,
  .table td {
    padding: 0.5rem;
    font-size: 0.8125rem;
  }
}
</style>
