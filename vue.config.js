const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: false,
      externals: ['sqlite3'],
      preload: 'src/preload.js',
      builderOptions: {
        // 确保原生模块正确打包
        asar: false,
        nodeGypRebuild: true,
        npmRebuild: true,
        buildDependenciesFromSource: false,
        // 指定架构
        arch: ['x64'],
        files: [
          "**/*",
          "!**/*.md",
          "!**/node_modules/**/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
          "!**/node_modules/**/{test,__tests__,tests,powered-test,example,examples}",
          "!**/node_modules/*.d.ts",
          "!**/node_modules/.bin",
          "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
          "!.editorconfig",
          "!**/._*",
          "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
          "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
          "!**/{appveyor.yml,.travis.yml,circle.yml}",
          "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
        ]
      }
    }
  },
  configureWebpack: {
    externals: {
      'sqlite3': 'commonjs sqlite3'
    },
    resolve: {
      fallback: {
        fs: false,
        path: false
      }
    }
  }
})
