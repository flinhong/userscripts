# 测试说明

## 运行测试

```bash
npm test
```

## 测试覆盖范围

- 配置文件验证（JSON/CSS）
- 核心代码语法检查
- 构建脚本功能测试
- 本地构建验证
- 发布构建验证
- 版本管理功能

## 测试配置

测试配置通过 `test-config.json` 管理。

## 文件结构

```
test/
├── README.md           # 测试说明
├── test.js            # 主测试文件
└── test-config.json   # 测试配置
```