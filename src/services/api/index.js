// API服务统一导出文件
import userApiService from './UserApiService';
import documentApiService from './DocumentApiService';
import settingsApiService from './SettingsApiService';

export {
  userApiService,
  documentApiService,
  settingsApiService
};

// 默认导出所有服务
export default {
  users: userApiService,
  documents: documentApiService,
  settings: settingsApiService
};